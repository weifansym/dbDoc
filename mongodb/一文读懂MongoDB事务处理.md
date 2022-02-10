### 事务
在MongoDB中，对单个文档的操作是原子的。由于可以在单个文档结构中使用内嵌文档和数组来获得数据之间的关系，而不必跨多个文档和集合进行范式化，所以这种单文档原子性避免了许多实际场景中对多文档事务的需求。

对于那些需要对多个文档（在单个或多个集合中）进行原子性读写的场景，MongoDB支持多文档事务。而使用分布式事务，事务可以跨多个操作、集合、数据库、文档和分片使用。
### 事务API
此示例突出显示了事务 API 的关键组件。

该示例使用新的回调API来进行事务处理，其中涉及启动事务、执行指定的操作并提交（或在出错时中止）。新的回调API还包含针对TransientTransactionError或UnknownTransactionCommitResult提交错误的重试逻辑。

**重要**
* 推荐。使用针对MongoDB部署版本更新的MongoDB驱动程序。对于MongoDB 4.2部署（副本集和分片集群上的事务，客户端必须使用为MongoDB 4.2更新的MongoDB驱动程序。
* 使用驱动程序时，事务中的每个操作必须与会话相关联（即将会话传递给每个操作）。
* 事务中的操作使用[事务级读关注](https://docs.mongodb.com/manual/core/transactions/#std-label-transactions-read-concern)，[事务级写关注]和[事务级读偏好](https://docs.mongodb.com/manual/core/transactions/#std-label-transactions-read-preference)。
* 在MongoDB 4.2及更早版本中，你无法在事务中创建集合。如果在事务内部运行会导致文档插入的写操作（例如insert或带有upsert: true的更新操作），必须在已存在的集合上才能执行。
* 从MongoDB 4.4开始，你可以隐式或显式地在事务中创建集合。但是，必须使用针对4.4更新的MongoDB驱动程序。有关详细信息，请参阅[在事务中创建集合和索引。](https://docs.mongodb.com/manual/core/transactions/#std-label-transactions-create-collections-indexes)
```
static bool
with_transaction_example (bson_error_t *error)
{
  mongoc_client_t *client = NULL;
   mongoc_write_concern_t *wc = NULL;
   mongoc_read_concern_t *rc = NULL;
   mongoc_read_prefs_t *rp = NULL;
   mongoc_collection_t *coll = NULL;
   bool success = false;
   bool ret = false;
   bson_t *doc = NULL;
   bson_t *insert_opts = NULL;
   mongoc_client_session_t *session = NULL;
   mongoc_transaction_opt_t *txn_opts = NULL;

   /* For a replica set, include the replica set name and a seedlist of the
    * members in the URI string; e.g.
    * uri_repl = "mongodb://mongodb0.example.com:27017,mongodb1.example.com:" \
    *    "27017/?replicaSet=myRepl";
    * client = test_framework_client_new (uri_repl);
    * For a sharded cluster, connect to the mongos instances; e.g.
    * uri_sharded =
    * "mongodb://mongos0.example.com:27017,mongos1.example.com:27017/";
    * client = test_framework_client_new (uri_sharded);
    */

   client = get_client ();

   /* Prereq: Create collections. */
   wc = mongoc_write_concern_new ();
   mongoc_write_concern_set_wmajority (wc, 1000);
   insert_opts = bson_new ();
   mongoc_write_concern_append (wc, insert_opts);
   coll = mongoc_client_get_collection (client, "mydb1", "foo");
   doc = BCON_NEW ("abc", BCON_INT32 (0));
   ret = mongoc_collection_insert_one (
      coll, doc, insert_opts, NULL /* reply */, error);
   if (!ret) {
      goto fail;
   }
   bson_destroy (doc);
   mongoc_collection_destroy (coll);
   coll = mongoc_client_get_collection (client, "mydb2", "bar");
   doc = BCON_NEW ("xyz", BCON_INT32 (0));
   ret = mongoc_collection_insert_one (
      coll, doc, insert_opts, NULL /* reply */, error);
   if (!ret) {
      goto fail;
   }

   /* Step 1: Start a client session. */
   session = mongoc_client_start_session (client, NULL /* opts */, error);
   if (!session) {
      goto fail;
   }

   /* Step 2: Optional. Define options to use for the transaction. */
   txn_opts = mongoc_transaction_opts_new ();
   rp = mongoc_read_prefs_new (MONGOC_READ_PRIMARY);
   rc = mongoc_read_concern_new ();
   mongoc_read_concern_set_level (rc, MONGOC_READ_CONCERN_LEVEL_LOCAL);
   mongoc_transaction_opts_set_read_prefs (txn_opts, rp);
   mongoc_transaction_opts_set_read_concern (txn_opts, rc);
   mongoc_transaction_opts_set_write_concern (txn_opts, wc);

   /* Step 3: Use mongoc_client_session_with_transaction to start a transaction,
    * execute the callback, and commit (or abort on error). */
   ret = mongoc_client_session_with_transaction (
      session, callback, txn_opts, NULL /* ctx */, NULL /* reply */, error);
   if (!ret) {
      goto fail;
   }

   success = true;
fail:
   bson_destroy (doc);
   mongoc_collection_destroy (coll);
   bson_destroy (insert_opts);
   mongoc_read_concern_destroy (rc);
   mongoc_read_prefs_destroy (rp);
   mongoc_write_concern_destroy (wc);
   mongoc_transaction_opts_destroy (txn_opts);
   mongoc_client_session_destroy (session);
   mongoc_client_destroy (client);
   return success;
}

/* Define the callback that specifies the sequence of operations to perform
 * inside the transactions. */
static bool
callback (mongoc_client_session_t *session,
          void *ctx,
          bson_t **reply,
          bson_error_t *error)
{
   mongoc_client_t *client = NULL;
   mongoc_collection_t *coll = NULL;
   bson_t *doc = NULL;
   bool success = false;
   bool ret = false;

   client = mongoc_client_session_get_client (session);
   coll = mongoc_client_get_collection (client, "mydb1", "foo");
   doc = BCON_NEW ("abc", BCON_INT32 (1));   ret =
      mongoc_collection_insert_one (coll, doc, NULL /* opts */, *reply, error);
   if (!ret) {
      goto fail;
   }
   bson_destroy (doc);
   mongoc_collection_destroy (coll);
   coll = mongoc_client_get_collection (client, "mydb2", "bar");
   doc = BCON_NEW ("xyz", BCON_INT32 (999));
   ret =
      mongoc_collection_insert_one (coll, doc, NULL /* opts */, *reply, error);   if (!ret) {
      goto fail;
   }

   success = true;
fail:
   mongoc_collection_destroy (coll);
   bson_destroy (doc);
   return success;
}
```
同样请参阅：

有关mongoshell中的示例，请参阅mongo[Shell示例](https://docs.mongodb.com/manual/core/transactions-in-applications/#std-label-txn-mongo-shell-example)。
### 事务和原子性
**说明

**分布式事务和多文档事务

从MongoDB 4.2开始，这两个术语是同义词。分布式事务是指分片集群和副本集上的多文档事务。从MongoDB 4.2开始，多文档事务（无论是在分片集群上还是副本集上）也称为分布式事务。

对于多文档（在单个或多个集合中）读写上有原子性要求的场景，MongoDB提供了多文档事务支持：
* 在4.0版本中，MongoDB支持副本集上的多文档事务。
* 在4.2版本中，MongoDB引入了分布式事务，增加了对分片集群上多文档事务的支持，并合并了对副本集上多文档事务的现有支持。

为了在MongoDB 4.2部署（副本集和分片集群）上使用事务，客户端必须使用为MongoDB 4.2更新的MongoDB驱动程序。
Multi-document transactions are atomic (i.e. provide an “all-or-nothing” proposition):

多文档事务是原子的（即提供“全有或全无”的语义）：
* 当事务提交时，事务中所做的所有数据更改都将保存并在事务外部可见。也就是说，事务不会在回滚其他更改时提交其某些更改。

在事务提交之前，事务中所做的数据更改在事务之外是不可见的。

然而，当事务写入多个分片时，并非所有外部读取操作都需要等待已提交事务的结果在分片中可见。例如，如果事务已提交并且写入操作1在分片A上可见，但写入操作2在分片B上尚不可见，
则外部读关注为“local”的读操作可以读取写入操作1的结果，看不到写入操作2。

* 当事务中止时，事务中所做的所有数据更改都将被丢弃，而不会变得可见。例如，如果事务中的任何操作失败，事务就会中止，并且事务中所做的所有数据更改都将被丢弃，而不会变得可见。

转自：[一文读懂MongoDB事务处理](https://mongoing.com/archives/81286)


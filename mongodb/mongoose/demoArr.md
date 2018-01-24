## 数组操作的demo

mongodb中数据的结构如下：
```
{
    "_id" : ObjectId("5a66a260fec8cc77e3fd636c"),
    "nick" : "UVbu",
    "images" : [],
    "originUrl" : "http://ulc.de/zkfesj",
    "star" : 3,
    "share" : 0,
    "thumbsUp" : 7,
    "comment" : 30,
    "status" : 0,
    "createTime" : ISODate("2018-01-23T02:48:00.075Z"),
    "postTime" : ISODate("2018-01-23T02:48:00.075Z"),
    "updateTime" : ISODate("2018-01-24T14:16:58.482Z"),
    "authorId" : "1234567891",
    "avatar" : "http://statictc.oss-cn-hangzhou.aliyuncs.com/avatar/385F8521-A027-4228-A187-B63D8530FD1B.jpg",
    "title" : "aaaaaaaa",
    "content" : "dddddddd",
    "__v" : 1,
    "lastComment" : {
        "userId" : "15162748922307120",
        "nick" : "ccc",
        "avatar" : ""
    },
    "score" : [ 
        90.0
    ],
    "thumbsUpList" : [ 
        {
            "userId" : "23123123123",
            "status" : 1.0
        }, 
        {
            "status" : 0,
            "_id" : ObjectId("5a689539be6617a2aa3df5a7"),
            "userId" : "15162748922307120"
        }
    ]
}

```

对应的业务操作如下：
```
/**
 * 更新用户点赞信息
 *
 * @param params
 * @returns {Promise<void>}
 */
async function newsThumbsUp(params) {
  let retData = new WebResponse();
  let newsDoc;
  let updateDoc;
  let condition = {"_id" : params.newsId};
  let projection = {'thumbsUp': 1};

  // const insertResult = NewsFlash.insert({"_id": params.newsId}, {});

  newsDoc = await NewsFlash.findOne(condition, projection);
  if (!newsDoc) {
    retData.code = exceptionCode.newsNotFoundExceptionCode;
    retData.message = exceptionMessage.newsNotFoundExceptionMsg;
    return retData;
  } else {
    if (params.status) {
      newsDoc.thumbsUp += 1;
    } else {
      newsDoc.thumbsUp -= 1;
    }
    newsDoc.save();
    condition = {"_id" : params.newsId, "thumbsUpList.userId": params.userId};
    projection = {"thumbsUpList": 1};
    const thumbsUpDoc = await NewsFlash.findOne(condition, projection);

    if (thumbsUpDoc && thumbsUpDoc.thumbsUpList && thumbsUpDoc.thumbsUpList.length > 0) {
      const updateContion = {"_id": params.newsId, "thumbsUpList.userId": params.userId};
      const update = {$set: {"thumbsUpList.$.status": params.status}}
      updateDoc = await NewsFlash.updateOne(updateContion, update);
    } else {
      const updateContion = {"_id": params.newsId};
      const update = {
        $push: {
          "thumbsUpList": {
            userId: params.userId,
            status: params.status
          }
        }
      }
      updateDoc = await NewsFlash.updateOne(updateContion, update);
    }

    console.log('updateDoc: ', updateDoc);
  }


}
```

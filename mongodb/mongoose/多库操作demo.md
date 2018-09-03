## 下面是mongoose多库操作
mongoose在单个项目中多个数据库操作，这里使用createConnetion方法进行多库操作。下面是一个demo
### mongoose.js
mongoose使用本地promise:
```
const mongoose = require('mongoose')

// 替换mongoose的Promise为原生，以统一所有Promise操作
// 替换Promise一定要在所有Model创建之前
// 所以使用该文件取代直接导入mongoose，确保Promise已被正确设置
mongoose.Promise = global.Promise

module.exports = mongoose
```
### mongoClients.js
```
//  初始化MongoDB链接
//  引用前面定义的mongoose.js文件
const mongoose = require('./mongoose')
const koaLogger = require('../utility/logger');

const logger = koaLogger.getLogger();

let newsConn = null;
let testConn = null;

/**
 * 初始化链接MongoDB
 *
 * @returns {Promise<void>}
 */
async function initializeMongoDBClient(mongodbConfigTest) {
  if (mongodbConfigTest && mongodbConfigTest.newsConf) {
    const newsConf = mongodbConfigTest.newsConf;
    try {
      newsConn = await mongoose.createConnection(newsConf.url, newsConf.options);
      logger.info('mongoose news db init success');
    } catch (e){
      logger.info('init connect mongodb news db error: ', e);
    }
  }
  if (mongodbConfigTest && mongodbConfigTest.testConf) {
    const testConf = mongodbConfigTest.testConf;
    try {
      testConn = await mongoose.createConnection(testConf.url, testConf.options);
      logger.info('mongoose test db init success');
    } catch (e){
      logger.info('init connect mongodb test db error: ', e);
    }
  }
}

function getNewsConn() {
  return newsConn;
}

exports.newsConn = newsConn;
exports.testConn = testConn;
exports.getNewsConn = getNewsConn;
exports.initializeMongoDBClient = initializeMongoDBClient;
```
### newsFlashModel.js
```
const mongoose = require('mongoose');
// const { newsConn } = require('../../utility/mongoClients');
const clients = require('../../utility/mongoClients');

const newsConn = clients.getNewsConn();

const { Schema } = mongoose;

/**
 * 快讯内容
 */
const newsFlashSchema = new Schema({
  //  作者id
  authorId: {
    type: String
  },
  //  标题内容
  title: {
    type: String,
  },
  //  内容
  content: {
    type: String,
    required: true
  },
  //  资讯相关图片
  images: {
    type: Array,
    default: []
  },
  //  原文链接
  originUrl: {
    type: String,
    default: '',
  },
  //  重要星级
  star: {
    type: Number,
    enum: [3, 5],
    default: 3,
  },
  //  转发数
  share: {
    type: Number,
    default: 0,
  },
  //  点赞数
  thumbsUp: {
    type: Number,
    default: 0,
  },
  //  评论数
  comment: {
    type: Number,
    default: 0,
  },
  //  最近一次评论的id
  lastComment: {
    userId: {
      type: String
    },
    nick: {
      type: String
    },
    avatar: {
      type: String
    }
  },
  //  资讯所属标签
  tags: [{
    name: String,
    bkColor: String,
  }],
  //  当前资讯状态
  status: {
    type: Number,
    enum: [0, 1],
    default: 1
  },
  //  是否推送
  needPush: {
    type: Number,
    enum: [0, 1],
    default: 0
  },
  //  快讯来源: 1: tokenclub, 2: 币快报
  source: {
    type: Number,
    enum: [1, 2],
    default: 1
  },
  //  第三方快讯编号，唯一标识快讯
  relateId: {
    type: String
  },
  //  创建时间
  createTime: {
    type: Date,
    default: Date.now,
    index: true
  },
  //  发布时间
  postTime: {
    type: Date,
    default: Date.now,
    index: true
  },
  //  修改时间
  updateTime: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: { createdAt: 'createTime', updatedAt: 'updateTime' }
});

newsFlashSchema.virtual('newsId').get(function () {
  return this._id;
});

const NewsFlash = newsConn.model('newsFlash', newsFlashSchema);

module.exports = NewsFlash;
```
导出了NewsFlash，我们就可以通过NewsFlash进行MongoDB操作了。



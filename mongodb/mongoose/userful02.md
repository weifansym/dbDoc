## mongodb常用操作

### 基于时间查询
主要是使用MongoDB自带的比较方法,demo如下:
```
async function queryNewsByTime(params) {
  let retData = new WebResponse();
  let newsDocList;
  //  开始时间
  let startTime = params.start ? new Date(params.start):moment({h: 0}).format();
  //  结束时间
  let endTime = params.end ? new Date(params.end): moment().format();

  const condition = {"createTime": {$gte: startTime, $lte: endTime}};
  try {
    newsDocList = await NewsFlash.find(condition);
  } catch (e) {
    logger.info('[queryNewsByTime]: error: ', e);
    retData.code = exceptionCode.queryNewsExceptionCode;
    retData.message = exceptionMessage.queryNewsExceptionMsg;
    return retData;
  }
  if (newsDocList) {
    retData.data = {
      newsList: newsDocList
    }
  }
  return retData
}
```

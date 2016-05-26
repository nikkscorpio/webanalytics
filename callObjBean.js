

function CallObjBean(objectId, streamCreator, createdAt, streamLength) {
  this.objectId = objectId;
  this.streamCreator = streamCreator;
  this.createdAt = createdAt;
  this.streamLength = streamLength;
}

module.exports = CallObjBean;
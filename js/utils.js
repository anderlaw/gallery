/*
  @ele:开始查找的节点
  @className：所需节点的className
  @rootNode：最上层的节点
*/
function findTopSpecificNode(ele, className, rootNode) {
  if (ele.classList.contains(className)) {
    return ele;
  }
  var tempNode;
  while ((tempNode = ele.parentElement) && tempNode !== rootNode) {
    if (tempNode.classList.contains(className)) {
      break;
    } else {
      ele = tempNode;
    }
  }
  return tempNode;
}
function listenBottomTabChange(cb) {
  //view-box | record-box
  var currentTarget = "view-box";
  var bottomTabBox = document.querySelector(".bottom-tab-box");
  bottomTabBox.addEventListener("click", function (ev) {
    var validTarget = findTopSpecificNode(ev.target, "item", bottomTabBox);
    validTarget && (currentTab = validTarget.dataset.target);
    if (validTarget && cb) {
      cb(currentTab);
    }
  });
}

function isMobile() {
  var userAgentInfo = navigator.userAgent;
  var Agents = new Array(
    "Android",
    "iPhone",
    "SymbianOS",
    "Windows Phone",
    "iPad",
    "iPod",
  );
  var flag = false;
  for (var v = 0; v < Agents.length; v++) {
    if (userAgentInfo.indexOf(Agents[v]) > 0) {
      flag = true;
      break;
    }
  }
  return flag;
}
function compressImgFile(file,maxKB){
  var maxKB = maxKB || 1024; //默认限制1MB
  return new Promise(function (res, rej) {
    var fileReader = new FileReader();
    fileReader.onload = function (event) {
      var temImgEle = document.createElement("img");
      temImgEle.onload = function () {
        var canvas = convertImageToCanvas(temImgEle);
        compressFile(canvas,function (file) {
          res(file);
        });
      };
      temImgEle.src = event.target.result;
    };
    fileReader.readAsDataURL(file);
    function compressFile(canvas, quality, cb) {
      if(!cb){
        cb = quality;
        quality = undefined;
      }
      quality = quality || 0.9; //默认0.9；
      quality = quality < 0.1 ? 0.1 : quality;
      canvas.toBlob(
        function (blob) {
          if (blob.size/1024 > maxKB) {
            compressFile(canvas, quality - 0.1, cb);
          } else {
            cb(new File([blob],"unkown.jpeg",{
              type: "image/jpeg",
            }));
          }
        },
        "image/jpeg",
        quality,
      );
    }
    function convertImageToCanvas(image) {
      var canvas = document.createElement("canvas");
      var context = canvas.getContext("2d");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalWidth;
      context.drawImage(
        image,
        0,
        0,
        canvas.width,
        canvas.height,
        0,
        0,
        canvas.width,
        canvas.height
      );
      return canvas;
    }
  });
}
function fileToBase64(file,maxKB,cb) {
  if(!cb){
    cb = maxKB;
    maxKB = undefined;
  }
  //默认最大一兆字节
  maxKB = maxKB || 1024;
  //判断是否需要压缩文件
  var fileSizeKB = file.size/1024;
  if(fileSizeKB > maxKB){
    //需要继续压缩
    compressImgFile(file,maxKB).then(function(newFile){
      var fileReader = new FileReader();
      fileReader.onload = function (ev) {
        //貌似不用关心是jpg还是png或者其他，直接发送base64数据，github会处理这些。
        //再拿时直接拿的是blob对象会再转回base64。
        var bs64 = ev.target.result;
        cb && cb(bs64);
      };
      fileReader.readAsDataURL(newFile);
    })
  }else{
    var fileReader = new FileReader();
    fileReader.onload = function (ev) {
      //貌似不用关心是jpg还是png或者其他，直接发送base64数据，github会处理这些。
      //再拿时直接拿的是blob对象会再转回base64。
      var bs64 = ev.target.result;
      cb && cb(bs64);
    };
    fileReader.readAsDataURL(file);
  }
  
}
// 每次取出10张照片，采取懒加载方式
var Gallery = (function () {
  var baseUrl = "https://api.github.com/repos/anderlaw/gallery";
  // var token = "token "+localStorage.getItem("token");
  var token = "token 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";
  return {
    fetchImageNames: function (resolve, reject) {
      return fetch(baseUrl + "/contents/images", {
        headers: {
          Authorization: token,
          Accept:"application/vnd.github.v3+json"
        },
      }).then(function (res) {
        return res.json();
      }).then(function (res) {
        return res.map(function(objItem){
          return objItem.name;
        })
      })
    },
    fetchImageData:function(fileName){
      return fetch(baseUrl + "/contents/images/"+fileName, {
        headers: {
          Authorization: token,
          Accept:"application/vnd.github.v3.raw"
        },
      }).then(function (res) {
          return res.blob();
        })
        .then(function (blob) {
          return new Promise(function(res){
            var reader = new FileReader();
            reader.onload = function (e) {
              var bs64 = e.target.result
              res(bs64)
            }
            reader.readAsDataURL(blob);
          })
        })
    },
    // 返回()=>promise
    recordImage: function (option) {
      return fetch(baseUrl + "/contents/images/" + option.fileName, {
        method: "put",
        headers: {
          Authorization: token,
          Accept:"application/vnd.github.v3+json"
        },
        body: JSON.stringify({
          message: option.message,
          //对传入的base64截掉文件类型标识和base64标识。
          content: option.base64.split("base64,")[1],
        }),
      }).then(function (res) {
        return res.json();
      })
    },
  };
})();

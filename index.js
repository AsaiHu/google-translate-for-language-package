const translate = require('google-translate-api');
const fs = require('fs');
const path = require("path");

const lang = "id";//当前翻译语言;
const inputFileName = "zh-CN.js";//被翻译文件
const outputFileName = "id-ID.js";//翻译保存文件
const dirPath = "./locale";//被翻译文件夹

fileRename(dirPath);
//遍历文件
function fileRename(filePath) {
  //根据文件路径读取文件，返回文件列表
  fs.readdir(filePath, function (err, files) {
    if (err) {
      console.warn(err)
    } else {
      //遍历读取到的文件列表
      files.forEach(function (filename) {
        //获取当前文件的绝对路径
        const filedir = path.join(filePath, filename);
        //根据文件路径获取文件信息，返回一个fs.Stats对象
        fs.stat(filedir, function (err, stats) {
          if (err) {
            console.warn('获取文件stats失败');
          } else {
            const isFile = stats.isFile();//是文件
            const isDir = stats.isDirectory();//是文件夹
            if (isFile) {
              if(filename===inputFileName){//判断是否是中文语言文件
                fileTranslate(filePath,filedir);
              }else{
                //console.log(filedir);
              }
            }
            if (isDir) {
              fileRename(filedir);//递归，如果是文件夹，就继续遍历该文件夹下面的文件
            }
          }
        })
      });
    }
  });
}

 //导入文件，调用api,导出文件
function fileTranslate(filePath,filedir){
  fs.readFile(filedir,'utf8',function(err,inputStream){
    if(err){
      console.warn(err)
    }else{
      inputStream=inputStream.replace("export default","module.exports=");//使export出的对象能够被require
      const filedirBuffer = path.join(filePath,"buffer.js")
      fs.writeFile(filedirBuffer,inputStream,function(err){
        if(err) {
          console.warn(err);
        }
        let data = require("./"+filedirBuffer);
        //通过promise阻塞结果，当所有请求都返回时抛出
        const promise = new Promise(function(resolve,reject){
          const keyList = Object.keys(data);
          let inCount=keyList.length,outCount=0;
          keyList.map(item=>{
            //调用谷歌api
            translate(data[item], { to: lang }).then(res => {
              outCount++;
              data[item] = res.text;
              if(inCount===outCount){
                resolve(data);
              }
            }).catch(err => {
              reject(err);
            });
          })
        }).then(()=>{
          const filedirSave = path.join(filePath,outputFileName);
          const outputStream = "export default " +JSON.stringify(data,null,'\t').replace(/"(\w+)"(\s*:\s*)/g, "$1$2");          ;
          fs.writeFile(filedirSave,outputStream,(err)=>{
            if(err){
              console.warn(err);
            }else{
              fs.unlink(filedirBuffer,(err)=>{
                if(err){
                  //console.log(err)
                  console.log(`警告！ ${filedirBuffer} 没有被删除`);
                }
              })
              console.log(filedir + " => " +filedirSave +" 完成")
            }
          })
        }).catch(ex=>{
          console.warn(ex);
        })
      })
    }
  });
}
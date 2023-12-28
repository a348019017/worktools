
//测试全景照片切片的代码
var fs = require("fs");
var path = require("path");
const sharp = require("sharp");
const exifReader = require('exifreader');


let thumbwidth=2048;
let thumbheight=1024;


  //水平切4，列项切8
let rownum=4;
let rowfbl=4096;
let columnnum=8;
let colfbl=8192;
let isforecerebuild=false;

const configpath="./config.json"

let inputfolder="C:/Users/34801/Desktop/全景图02-22"
let outputfolder="C:/Users/34801/Desktop/全景图02-22"
//配置文件所在目录
let configfolder='C:/Users/34801/Desktop/全景图02-22/qindex.json'
let configexpfolder='C:/Users/34801/Desktop/全景图02-22/qindex1.json'


/**
 * 验证图片是否符合要求，如长宽比
 */
function validateImages(rptah) {
  return sharp(rpath).metadata().then(mt=>{
     let width= mt.width;
     let height=mt.height;
     if(width/height==2.0){
      let ratio= width%columnnum;
       if(ratio!=0)
       {
        console.log(`切片数为${rownum}*${columnnum},无法等分切，请修改配置文件中的rownum和colnum`);
        return false;
       }
       return true;
     }
     console.log("只支持长宽比为2:1的图片")
     return false;
  });
}


//  function test(){

//   try {
//     var config= fs.readFileSync(configpath);
//     let configJSON=JSON.parse(config);
//     rownum=configJSON.rownum;
//     columnnum=configJSON.colnum;
//   } catch (error) {
//     console.log("读取配置文件失败，将采用默认配置！")
//   }
    

//     //遍历目录中的图片
//     var pa = fs.readdirSync(inputfolder);
// 	pa.forEach(function(ele,index){
// 		var info = fs.statSync(inputfolder+"/"+ele)	
// 		if(info.isDirectory()){
            
// 			//console.log("dir: "+ele)
// 			//readDirSync(path+"/"+ele);
// 		}else{
// 			if(ele.endsWith(".JPG")||ele.endsWith(".jpg")||ele.endsWith(".png")||ele.endsWith(".PNG"))
//             {
//               if(!validateImages(ele))
//               {
//                    console.log(`图片${ele}无法切片，继续！`)
//                    return;
//               }
//                 let rpath = inputfolder + "/" + ele;
//                 let outputfs = outputfolder + "/" + ele.replace(".JPG", "");
//                 if (!fs.existsSync(outputfs)) {
//                   fs.mkdirSync(outputfs);
//                 }
//                 let outputf =outputfs+ "/" + ele.replace(".JPG", "") + "_low.JPG";
//                 //运行命令
//                 sharp(rpath)
//                   .resize(thumbwidth, thumbheight)
//                   .toFile(outputf, function (err) {
//                      console.log(err);
//                   });
//                   sharp(rpath).metadata().then(mt=>{
//                     console.log(mt);
//                   })
//                 for (let i = 0; i < rownum; i++) {
//                     for (let j = 0; j < columnnum; j++) {
//                         const region={left:j*1024,top:i*1024,width:1024,height:1024};
//                         const newfilename=outputfs+"/"+`row-${i+1}-column-${j+1}.jpg`;
//                         sharp(rpath).extract(region).toFile(newfilename,function(err){
//                             //console.log(`${newfilename}：exporterr:${err}`);
//                         }) 
//                     }
                    
//                 }
                
//             }
// 		}	
// 	})
// }



  //获取js所在文件目录__dirname不再当前目录
  inputfolder = process.cwd();
  outputfolder = process.cwd();
  configfolder = path.join(process.cwd(), "qindex.json");
  configexpfolder = path.join(process.cwd(), "qindex1.json");

console.log(inputfolder);
console.log(outputfolder);
console.log(configfolder);
console.log(configexpfolder);


//添加标注到配置文件中
function addmarkers(dkname, filename, config) {
  try {
    //如果是文本
    if (filename.endsWith(".JPG")) {
      let imagefilename = filename.replace(".JPG", "");
      let rpath = inputfolder + "/" + dkname + "/" + imagefilename+".txt";
      if(!fs.existsSync(rpath)) 
      return;
      let marks = fs.readFileSync(rpath).toString();
      marks=marks.replace("markers: ","")
      marks = JSON.parse(marks);
      //遍历polygon修改为polygon
      marks.forEach(m=>{
        if(m.polygon)
        {
          m.polygonRad=m.polygon;
          delete m['polygon'] ;
          m.svgStyle.fill="rgba(189, 195, 200,0.5)"         ;   
        }
  
        if(m.position)
        {
          m.longitude=m.position.yaw;
          m.latitude=m.position.pitch;
          delete m['position'] ;
        }
      })
      config.markers=marks;
    }
  } catch (err) {
    console.log(filename + "add marker error"+err);
  }
}

//
function  proccessimage(dkname,ele,config){
    
    if(ele.toUpperCase().endsWith(".JPG"))
    {
      ele=ele.toUpperCase();
      let imagefilename = ele.replace(".JPG", "");
      let rpath = inputfolder + "/" + dkname + "/" + ele;
      let outputfs =
        outputfolder + "/" + dkname + "/" + ele.replace(".JPG", "");
      if (!fs.existsSync(outputfs)) {
        fs.mkdirSync(outputfs);
      }
      let outputf = outputfs + "/" + ele.replace(".JPG", "") + "_low.JPG";

      //创建缓存
      let p1 = sharp(rpath)
        .resize(2048, 1024)
        .toFile(outputf, function (err) {
          console.log(err);
        });
      let p2 = sharp(rpath)
        .metadata()
        .then((mt) => {
          let width = mt.width;
          let height = mt.height;
          if (width / height != 2.0) {
            console.log("图片" + ele + ":不满足长宽比2:1，因此不能裁切");
          }

          let size = mt.height / rownum;

          //获取到长宽后
          for (let i = 0; i < rownum; i++) {
            for (let j = 0; j < columnnum; j++) {
              const region = {
                left: j * size,
                top: i * size,
                width: size,
                height: size,
              };
              const newfilename =
                outputfs + "/" + `row-${i + 1}-column-${j + 1}.jpg`;
              sharp(rpath)
                .extract(region)
                .toFile(newfilename, function (err) {
                  //console.log(`${newfilename}：exporterr:${err}`);
                });
            }
          }
        });

      //运行命令
      const tags = exifReader.load(rpath).then((dt) => {
        //console.log(dt)
        let lat = dt.GpsLatitude ? Number.parseFloat(dt.GpsLatitude.value) : 0;
        // lat=dt.GPSLatitude?dt.GPSLatitude.description:lat;
        // //let lat=Number.parseFloat(dt.GPSLatitude.description&&dt.GpsLatitude.value);
        let lng = dt.GpsLongitude
          ? Number.parseFloat(dt.GpsLongitude.value)
          : 0;
        // lng=dt.GPSLongitude.description?lng;

        let alt = Number.parseFloat(
           (dt.AbsoluteAltitude&&dt.AbsoluteAltitude.value) || (dt.GPSAltitude&& dt.GPSAltitude.value)
        );
        let ralt = Number.parseFloat((dt.RelativeAltitude&&dt.RelativeAltitude.value) || 0.1);

        if (!config.images) {
          config.images = [];
        }
        let selectedimage = config.images.find((i) => {
          return i.imagename == ele.replace(".JPG", "");
        });
        if (selectedimage) {
          selectedimage.lonlat
            ? undefined
            : (selectedimage.lonlat = [lng, lat, alt]);
          selectedimage.height ? undefined : (selectedimage.height = ralt);
          selectedimage.longitudeoffset == undefined
            ? (selectedimage.longitudeoffset = 0)
            : undefined;
        } else {
          //创建一个新的image
          selectedimage = {
            imagename: imagefilename,
            lonlat: [lng, lat, alt],
            height: ralt,
            longitudeoffset: 0,
          };
          config.images.push(selectedimage);
        }
        //默认采用瓦片
        selectedimage.usetile = true;
        addmarkers(dkname, ele, selectedimage);
      });
      return Promise.all([p1,p2,tags]);
    }
   // addmarkers(dkname,ele,config);
}


//将照片的坐标写入到配置文件中并copy
function readgpsandwriteconfig(){
    //遍历目录中的图片
    var pa = fs.readdirSync(inputfolder);
    let alltask = [];
    let cc=[];
    if(fs.existsSync(configfolder))
    {
        cc = fs.readFileSync(configfolder).toString();
        cc = JSON.parse(cc);
    }
    pa.forEach(function (ele, index) {
      var info = fs.statSync(inputfolder + "/" + ele);
      
      //查找子目录，获取其地块名称，然后再
      if (info.isDirectory()) {
        let dkconfig = cc.find((i) => i.name == ele);
        if (!dkconfig) {
          dkconfig = {
            name: ele,
            images: [],
          };
          cc.push(dkconfig);
        }
        if (!dkconfig.images) {
          dkconfig.images = [];
        }
        var cpa = fs.readdirSync(inputfolder + "/" + ele);
        cpa.forEach(function (cele, cindex) {
            
          var cinfo = fs.statSync(inputfolder + "/" + ele + "/" + cele);
          
          if (!cinfo.isDirectory()) {
            alltask.push(proccessimage(ele, cele, dkconfig));
          }
        });
      }
    });
    
    Promise.all(alltask).then((dd) => {
      console.log("运行到这"+cc)
        if(fs.existsSync(configfolder))
        {
            fs.copyFileSync(configfolder,configexpfolder);
        }
        
      //完成任务后导出
      fs.writeFileSync(configfolder, JSON.stringify(cc));
    }).catch(err=>{
      console.log("运行出错")
    });
}


readgpsandwriteconfig();




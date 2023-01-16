
//测试全景照片切片的代码
var fs = require("fs");
var path = require("path");
const sharp = require("sharp");
const exifReader = require('exifreader');
  //水平切4，列项切8
const rownum=4;
const rowfbl=4096;
const columnnum=8;
const colfbl=8192;
let isforecerebuild=false;

let inputfolder="C:/Users/34801/Desktop/全景图02-22"
let outputfolder="C:/Users/34801/Desktop/全景图02-22"
//配置文件所在目录
let configfolder='C:/Users/34801/Desktop/全景图02-22/qindex.json'
let configexpfolder='C:/Users/34801/Desktop/全景图02-22/qindex1.json'
 function test(){
    //遍历目录中的图片
    var pa = fs.readdirSync(inputfolder);
	pa.forEach(function(ele,index){
		var info = fs.statSync(inputfolder+"/"+ele)	
		if(info.isDirectory()){
            
			//console.log("dir: "+ele)
			//readDirSync(path+"/"+ele);
		}else{
			if(ele.endsWith(".JPG"))
            {
                let rpath = inputfolder + "/" + ele;
                let outputfs = outputfolder + "/" + ele.replace(".JPG", "");
                if (!fs.existsSync(outputfs)) {
                  fs.mkdirSync(outputfs);
                }
                let outputf =outputfs+ "/" + ele.replace(".JPG", "") + "_low.JPG";
                //运行命令
                sharp(rpath)
                  .resize(2048, 1024)
                  .toFile(outputf, function (err) {
                     console.log(err);
                  });
                  sharp(rpath).metadata().then(mt=>{
                    console.log(mt);
                  })
                for (let i = 0; i < rownum; i++) {
                    for (let j = 0; j < columnnum; j++) {
                        const region={left:j*1024,top:i*1024,width:1024,height:1024};
                        const newfilename=outputfs+"/"+`row-${i+1}-column-${j+1}.jpg`;
                        sharp(rpath).extract(region).toFile(newfilename,function(err){
                            //console.log(`${newfilename}：exporterr:${err}`);
                        }) 
                    }
                    
                }
                
            }
		}	
	})
}



  //获取js所在文件目录__dirname不再当前目录
  inputfolder = process.cwd();
  outputfolder = process.cwd();
  configfolder = path.join(process.cwd(), "qindex.json");
  configexpfolder = path.join(process.cwd(), "qindex1.json");
  console.log("isbuildmode")

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
    if(ele.endsWith(".JPG"))
    {
        let imagefilename=ele.replace(".JPG", "");
        let rpath = inputfolder + "/"+ dkname+"/" + ele;
        let outputfs = outputfolder + "/" + dkname+"/"+ ele.replace(".JPG", "");
        if (!fs.existsSync(outputfs)) {
          fs.mkdirSync(outputfs);
        }
        let outputf =outputfs+ "/" + ele.replace(".JPG", "") + "_low.JPG";

            //创建缓存
            sharp(rpath)
              .resize(2048, 1024)
              .toFile(outputf, function (err) {
                console.log(err);
              });
            sharp(rpath)
              .metadata()
              .then((mt) => {
                //console.log(mt);
              });
            for (let i = 0; i < rownum; i++) {
              for (let j = 0; j < columnnum; j++) {
                const region = {
                  left: j * 1024,
                  top: i * 1024,
                  width: 1024,
                  height: 1024,
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

        //运行命令
        const tags =  exifReader.load(rpath).then(dt=>{
            //console.log(dt)
            let lat=Number.parseFloat(dt.GpsLatitude.value);
            let lng=Number.parseFloat(dt.GpsLongitude.value);
            let alt=Number.parseFloat(dt.AbsoluteAltitude.value);
            let ralt=Number.parseFloat(dt.RelativeAltitude.value);
          
            if(!config.images)
            {
                config.images=[];
            }
            let selectedimage=config.images.find(i=>{
                return i.imagename==ele.replace(".JPG", "")
            })
            if(selectedimage)
            {
                selectedimage.lonlat?undefined:selectedimage.lonlat=[lng,lat,alt];
                selectedimage.height?undefined:selectedimage.height=ralt;
                selectedimage.longitudeoffset==undefined?selectedimage.longitudeoffset=0:undefined;
            }
            else
            {
                //创建一个新的image
                 selectedimage={
                      imagename:imagefilename,
                      lonlat:[lng,lat,alt],
                      height:ralt,
                      longitudeoffset:0,
                }
                config.images.push(selectedimage);
            }      
            //默认采用瓦片
            selectedimage.usetile=true;      
            addmarkers(dkname,ele,selectedimage)
        })
        return tags;   
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
        if(fs.existsSync(configfolder))
        {
            fs.copyFileSync(configfolder,configexpfolder);
        }
      //完成任务后导出
      fs.writeFileSync(configfolder, JSON.stringify(cc));
    });
}


readgpsandwriteconfig();




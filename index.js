var express=require('express');
var app=express();
var path = require('path');
var request = require('request');
var mongo=require('mongodb').MongoClient;

var port = process.env.PORT||8080;

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});


app.get('/api/imagesearch/:img?',function(req,res){
    var parameters={"q":req.params.img,"offset":req.query.offset};
    var reqURL = 'https://api.cognitive.microsoft.com/bing/v5.0/images/search?q='+parameters.q;
    if(req.query.hasOwnProperty('offset')){
        reqURL=reqURL+"&offset="+parameters.offset;
    }
    var dbURL=process.env.MONGOLAB_URI;
    mongo.connect(dbURL,function(err,db){
        if(!err){
            var dateTime = new Date();
            db.collection('imgreq').insert({'term':parameters.q,'when':dateTime});
            db.close();
        }
    });
    
    request.post({url:reqURL, 
        headers: {'Content-Type': 'multipart/form-data',
                'Host':'api.cognitive.microsoft.com',
                'Ocp-Apim-Subscription-Key':'27717d9bc057421b84edf63d8f6684f0'}},
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var results=JSON.parse(body);
                var responseArr=[];
                for(var i =0;i<20;i++){
                  responseArr.push({"url":"http://"+results.value[i]['hostPageDisplayUrl'],
                  "name":results.value[i]['name'],
                  "thumbnail":results.value[i]['thumbnailUrl']});  
                }
                res.send(responseArr);
            }
        });
    

});

//{"url":"","snippet":"","thumbnail":"","context":""} 
//

app.get("/api/latest/imagesearch/",function(req,res){
    var dbURL=process.env.MONGOLAB_URI;
    mongo.connect(dbURL,function(err,db){
        if(err){
            res.send(err);
        }else{
           var collection =db.collection('imgreq');
           collection.find({}).sort({'when':-1}).limit(20).toArray(function(err,result){
               if(err){
                   res.send("No document found")
               }else{
                   res.send(result);
               }
               db.close();
           });
        }
    });
});

app.listen(port, function(){
    console.log("Server Started");
});
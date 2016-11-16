var express=require('express');
var app=express();
var mongo=require('mongodb').MongoClient;

var port = process.env.PORT||8080;

app.get('/', function(req,res){
    res.send("To use this API, use the following format at end of above URL '/new/--fullURL--' and JSON of your new URL will return.");
});
//export MONGOLAB_URI="mongodb://<dbuser>:<dbpassword>@ds153657.mlab.com:53657/tinyurl"
app.get('/new/:url*',function(req,res){
    var expression = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi;
    var regex = new RegExp(expression);
    var url=req.url.slice(5);
    if(url.match(regex)){
        var dbURL=process.env.MONGOLAB_URI;
        mongo.connect(dbURL,function(err,db){
            if(!err){
                db.collection('urls').find({'url':url}).toArray(function(err,result){
                    if(result.length>0){
                        var response = {"original_url":url,"short_url":""};
                        response['short_url']=req.protocol+"://"+req.hostname+"/"+result[0].tiny;
                        res.send(response);
                    }else{
                        db.collection('urls').find().sort({tiny:-1}).limit(1).toArray(function(err,result){
                            
                            if(!err){
                                var tiny=parseInt(result[0].tiny)+1;
                                var response = {"original_url":url,"short_url":""};
                                response['short_url']=req.protocol+"://"+req.hostname+"/"+tiny;
                                db.collection('urls').insert({'url':url,'tiny':tiny});
                                res.send(response);
                                db.close();
                            }
                            
                        });
                    }
                });
            }
         
        });
    }else{
        res.send({"error":"Wrong url format"});
    }
});


app.get("/:url",function(req,res){
    var dbURL=process.env.MONGOLAB_URI;
    mongo.connect(dbURL,function(err,db){
        if(err){
            res.send(err);
        }else{
           var collection =db.collection('urls');
           collection.find({"tiny":req.params.url}).toArray(function(err,result){
               if(err){
                   res.send("No document found")
               }else if(result.length>0){
                  
                  res.redirect(result[0].url); 
               }else{
                   res.send("No such url in our system");
               }
               db.close();
           });
        }
    });
});

app.listen(port, function(){
    console.log("Server Started");
});
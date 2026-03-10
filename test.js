const http = require("http");
http.createServer((req,res)=>{
  res.end("OK");
}).listen(3000, "0.0.0.0", ()=>console.log("OK http://localhost:3000"));
//import { createClient } from 'redis';
var Redis = require('ioredis');

//import pc  from 'picocolors';
var pc = require('picocolors');

//import express from 'express'
var express = require('express');

const app = express()
app.disable('x-powered-by');

//const redis = new Redis("redis://db-redis:6379");

const PORT = process.env.PORT ?? 5000;


/*const client = createClient({
    url: "redis://db-redis:6379" 
});*/
const client = new Redis("redis://db-redis:6379");

app.use((req, res, next) => {
    // Permitir solicitudes desde cualquier origen
    res.setHeader('Access-Control-Allow-Origin', '*');
  
    // Permitir los métodos HTTP que se pueden utilizar en las solicitudes
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  
    // Permitir ciertos encabezados en las solicitudes
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization', 'Content-Type, ');
  
    // Permitir que las cookies se incluyan en las solicitudes (si es necesario)
    res.setHeader('Access-Control-Allow-Credentials', true);

    next();
  });

  app.options('*', (req, res) => {
    // Respondemos con éxito a las solicitudes OPTIONS
    res.status(200).end();
  });

app.use(express.json());

// #region GET
app.get('/', (req, res) => {
    try {
        res.status(200).send("Funcionamiento correcto")
    } catch (error) {
        res.status(404).send("Error " + error)
    }
})

app.get('/Locations/All/:categories', async (req,res) =>{
    const {categories} = req.params;
    try {
        //await client.connect();
        
        let value = await client.zrange(categories,0,-1);
        
        //await client.disconnect();
        
        res.status(200).send(JSON.stringify(value));
    } catch (error) {
        console.error(pc.red(error));
        res.status(404).send("error" + error);
    }
})

app.get('/Locations/:categories/:lat/:long/Km:dis', async (req,res) =>{
    const {categories,lat,long,dis} = req.params;
    try {
        //await client.connect();
        let groupName
        switch(categories){
            case "Cerv":
                groupName = "Cervecerias_Artesanales"
                break;
            case "Unv":
                groupName = "Universidades"
                break;
            case "Far":
                groupName = "Farmacias"
                break;
            case "CentEm":
                groupName = "Centro_de_atencio_de_emergencias"
                break;
            case "Super":
                groupName = "Supermercados"
                break;
            default:
                groupName = ""
                break;
        }
        console.log(pc.cyan(`categories:${groupName} - long:${long} - lat:${lat} - dis:${dis}`))

        let value
        if(groupName != ""){
            value = await client.georadius(groupName, long, lat, dis, 'km');
        }

        //await client.disconnect();
        console.log(pc.green(value))
        res.status(200).send(JSON.stringify(value));
    } catch (error) {
        console.error(pc.red(error))
        res.status(500).send("error: "+error);
    }
    //await client.disconnect();
})
app.get('/Distance/:categories/:locate/me/:lat/:long/', async (req,res) =>{
    const {categories, locate, lat, long} = req.params;
    try {
        //await client.connect();

        let groupName
        switch(categories){
            case "Cerv":
                groupName = "Cervecerias_Artesanales"
                break;
            case "Unv":
                groupName = "Universidades"
                break;
            case "Far":
                groupName = "Farmacias"
                break;
            case "CentEm":
                groupName = "Centro_de_atencio_de_emergencias"
                break;
            case "Super":
                groupName = "Supermercados"
                break;
            default:
                groupName = ""
                break;
        }

        let dist
        if(groupName != ""){
            
            await client.geoadd(groupName, long, lat, 'me');
            console.log(`groupName: ${groupName}, long: ${long}, lat: ${lat}`)
            console.log(`locate: ${locate}`)
            dist = await client.geodist(groupName, locate, 'me', 'M');

            await client.zrem(groupName, "me");

            res.status(200).send(JSON.stringify(dist));
        }else{
            res.status(500).send("ERROR");
        }

        //let dist = await client.GEODIST(categories, locate, ubi);
        //await client.disconnect();
        
        
    } catch (error) {
        //await client.disconnect();
        console.log(error)
        res.status(500).send("error: "+error);
    }
})

// #region POST
app.post('/addNewLocate', async (req, res) =>{
    console.log(pc.magenta("stape1-Init"));

    const {
        group,
        name,
        long,
        lat,
    } = req.body;
    let groupName;
    //await client.connect();
    switch(group){
        case "Cerv":
            groupName = "Cervecerias_Artesanales"
            break;
        case "Unv":
            groupName = "Universidades"
            break;
        case "Far":
            groupName = "Farmacias"
            break;
        case "CentEm":
            groupName = "Centro_de_atencio_de_emergencias"
            break;
        case "Super":
            groupName = "Supermercados"
            break;
        default:
            groupName = ""
            break;
    }

    if(groupName != ""){
        await client.geoadd(groupName, long, lat, name);
        console.log(pc.cyan(`grupo: ${groupName} - longitud: ${long} - latitud:${lat} - nombre: ${name} `))
        res.status(200).send("OK");
    }else{
        res.status(500).send("ERROR");
    }
    //await client.disconnect();   

    
})


app.use((req, res) => {
    res.status(404).send('<h1> error 404 </h1>');
})
app.listen(PORT, () => {
    console.log(pc.cyan(`server listening port: http://localhost:${PORT}`));
    console.log(pc.bgCyan("=================")+pc.cyan(" INICIADO ")+pc.bgCyan("================="));
    console.log(pc.bgCyan("=================")+pc.cyan("  Listo   ")+pc.bgCyan("================="));   
})
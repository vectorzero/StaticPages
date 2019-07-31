const Koa = require('koa');
const app = new Koa();
const Router = require('koa-router');
const router = new Router();
const https = require('https');
const url = require('url');


router.get('/getImg', async (ctx, next) => {
    await getMiniProgramCode(ctx)
});
app.use(router.routes());

app.listen(3000);
console.log('listening 3000 ...');

async function getMiniProgramCode (ctx) {
    let sceneParam = 'test';
    let pagePath = '';
    let appid = ''; // 小程序的appId
    let appsecret = ''; // 密钥

    ctx.query.scene && (sceneParam = ctx.query.scene);
    ctx.query.path &&  (pagePath = ctx.query.path);
    ctx.query.appid &&  (appid = ctx.query.appid);
    ctx.query.appsecret &&  (appid = ctx.query.appsecret);
    
    const S_TO_MS = 1000;  // 秒到毫秒的转换。
    if (!global.access_token || global.access_token.timestamp + global.access_token.expires_in * S_TO_MS <= new Date() - 300) {        
        // 过期，获取新的 token
    }
    // 获取 token
    const accessTokenObj = await new Promise( (resolve, reject) =>{
        https.get(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${appsecret}`, res => {
            let resData = '';
            res.on('data', data => {
                resData += data;
            });
            res.on('end', () => {
                resolve( JSON.parse(resData) );
            })
        })
    }).catch(e => {
        console.log(e);
    });
    // 这里应该加一个判断的，因为可能请求失败，返回另一个 JSON 对象。
    global.access_token = Object.assign(accessTokenObj, {timestamp: +new Date()});

    const access_token = global.access_token.access_token;
    const post_data = JSON.stringify({
        path: pagePath,
        scene: sceneParam, // 最多32个字符。
        width: 200 // 生成的小程序码宽度。
    });

    let options = url.parse(`https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${access_token}`);
    options = Object.assign(options, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': post_data.length,
        }
    });

    // 获取图片二进制流
    const {imgBuffer, contentType} = await new Promise((resolve, reject) => {
        let req = https.request(options, (res) => {
            let resData = '';
            res.setEncoding("binary");
            res.on('data', data => {
                resData += data;
            });
            res.on('end', () => {
                // 微信api可能返回json，也可能返回图片二进制流。这里要做个判断。
                const contentType = res.headers['content-type'];
                if ( !contentType.includes('image') ) {
                    console.log('获取小程序码图片失败，微信api返回的json为：')
                    console.log( JSON.parse(resData) )
                    return resolve(null);
                }
                const imgBuffer = Buffer.from(resData, 'binary');
                resolve( {imgBuffer, contentType} );
            });
        });
        req.on('error', (e) => {
            console.log('获取微信小程序图片失败')
            console.error(e);
        });
        req.write(post_data);   // 写入 post 请求的请求主体。
        req.end();
    }).catch(() => {
        return null;
    });

    if (imgBuffer == null) {
        ctx.body = {code: 223, msg: '获取小程序码失败'};
        return;
    }
    ctx.res.setHeader('Content-type', contentType);
    ctx.body = imgBuffer;
}


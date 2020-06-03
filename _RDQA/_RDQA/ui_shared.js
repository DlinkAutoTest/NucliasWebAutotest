const assert = require('assert');
const fs = require('fs');
const puppeteer = require('puppeteer');
const addContext = require('mochawesome/addContext');
const width = 1024;
const height = 768;
let browser;
let { TEST_ACCOUNT, ORG_USER_CREDENTIALS, SHOULD_FAIL, SITE='nttrd', PASSWORD='bizcloud' } = process.env;
if(ORG_USER_CREDENTIALS){
  [TEST_ACCOUNT,] = ORG_USER_CREDENTIALS.trim().split(",");
  process.env.TEST_ACCOUNT = TEST_ACCOUNT;
}

const self = module.exports;
self.urlOthers = [];
self.urlXRH = [];
self.TIMEOUT = 600000;
// self.userLoggedin = false;
self.verifyModeEnable = false;
self.puppeteerPageParams = { waitUntil: 'networkidle2', timeout: 0 };
self.getScreenshotPath = function(fileName, tmpSiteName){
  return `${self.getScreenshotFolder()}/img/${tmpSiteName ? tmpSiteName : SITE}-${fileName}.png`;
}

self.getScreenshotUri = function(fileName, tmpSiteName){
  return `img/${tmpSiteName ? tmpSiteName : SITE}-${fileName}.png`;
}

self.getScreenshotFolder = function(){
  return './tmp';
}

self.getSitename = function(sitename){
  return `https://${sitename}.nuclias.com`;
}

self.SITE = function(){
  return self.getSitename(SITE);
}

self.capture = async (filename, context, key) => {
  await self.page.waitFor(2000);
  let imgName = `${filename}-${key}`;
  let path = self.getScreenshotPath(imgName);
  await self.page.screenshot({ fullPage: true, path });
  addContext(context, self.getScreenshotUri(imgName));
}

self.before = async function() {

  this.timeout(self.TIMEOUT);
  if (fs.existsSync(self.USER_DATA_FILE)) {
    _.assign(result, require(self.USER_DATA_FILE));
    self.verifyModeEnable = true;
  }

  browser = await puppeteer.launch({
    headless: false,
    slowMo: 10,
    args:[
      '--no-sandbox',
      '--disable-setuid-sandbox',
      `--window-size=${ width },${ height }`
    ]
  });
  self.page = await browser.newPage();
  self.page.on('request', r => {
    (r.resourceType() === 'xhr' && !r.url().match(/html$/) ? self.urlXRH : self.urlOthers).push(r.url());
  });
  self.page.on('requestfailed', request => {
    const errMsg = `requestfailed: ${request.url()} ${request.failure().errorText}`;
    if(request.url().indexOf('fbstatic-a.akamaihd.net') > -1){
      console.debug(`Ignore: ${errMsg}`);
      return;
    }
    console.error(errMsg);
  });
};

self.after = async function(){
  this.timeout(self.TIMEOUT);
  if(browser){
    await browser.close();
  }
};

self.shouldLogin = function(redirectSite){
  const TMP_SITENAME = redirectSite ? redirectSite : SITE;
  it('has form', async function() {
    const loginUrl = `${self.getSitename(TMP_SITENAME)}/#/login`;
    this.test.title += ` - ${loginUrl}`;
    const response = await self.page.goto(loginUrl, self.puppeteerPageParams);
    const { status } = response.headers();
    assert.equal('200', status);
    await self.page.waitFor('#login_email');
    const email = await self.page.$('#login_email');
    await self.page.screenshot({ fullPage: true, path: self.getScreenshotPath('01', TMP_SITENAME)});
    assert.ok(email);
    addContext(this, self.getScreenshotUri('01', TMP_SITENAME));
  }).timeout(self.TIMEOUT);

  it('do login', async function(){
    await self.page.type('input#login_email', TEST_ACCOUNT);
    await self.page.type('input#login_h_pwd', PASSWORD);


    await self.page.screenshot({ fullPage: true, path: self.getScreenshotPath('02', TMP_SITENAME)});
    addContext(this, self.getScreenshotUri('02', TMP_SITENAME));

    await self.page.click('button#login_submit');
    await self.page.waitFor(3000);

    const failCount = (await self.page.$$('#login_error_message > div')).length;
    if (failCount > 0) {
      const fail = await self.page.$eval('#login_error_message > div', el => el.textContent.trim());
      SHOULD_FAIL ? assert.ok(true) : assert.fail(fail);
      return;
    }

    await self.page.waitFor(3000);
    await self.page.waitFor('.v2-user-name');
    await self.page.waitFor(3000);
    try {
      await self.page.click('button#accept_system_version_accept_button');
      await self.page.waitFor(1000);
    }catch(e){}
    const userName = await self.page.$eval('.v2-user-name', el => el.textContent.trim());
    await self.page.screenshot({ fullPage: true, path: self.getScreenshotPath('03')});
    assert.notEqual(userName, null);
    assert.notEqual(userName, '');
    const url = await self.page.url();
    this.test.title += ` - ${url}`;
    this.test.title += ` - ${userName}`;
    addContext(this, userName);
    addContext(this, url);
    addContext(this, self.getScreenshotUri('03'));
  }).timeout(self.TIMEOUT);
}
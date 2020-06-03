const assert = require('assert');
const shared = require(`${__dirname}/../ui_shared.js`);
const addContext = require('mochawesome/addContext');
const { SITE, TEST_ACCOUNT } = process.env;
const filename = __filename.replace(__dirname, "").replace(".js", "").replace("/", "");
const goUrl = `${shared.SITE()}/#/settings/alert-settings`;

before(shared.before);

describe(`${filename} - ${TEST_ACCOUNT} - AP ${SITE}`, () => {

  shared.shouldLogin();

  it('AP Push Config', async function () {
    
    await shared.page.goto(goUrl, shared.puppeteerPageParams);
    await shared.page.waitFor('#s_as_email_notifyFWUpgradeSuccess');
    await shared.page.evaluate(()=>document.querySelector('#s_as_email_notifyFWUpgradeSuccess').click())
    await shared.page.click('#s_as_save');
    await shared.capture('123', this, '01');
    await shared.page.waitFor(10000);

  }).timeout(shared.TIMEOUT);
});


after(shared.after);
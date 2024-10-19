const puppeteer = require("puppeteer");
const axios = require("axios");
const cron = require("node-cron");

async function scrapingSchedule() {
  //GUImodeに変更の場合、headlessの値をfalse
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto("https://sushitomo.akindo-sushiro.co.jp/login");
  //入力速度を設定する場合第３引数に{delay:100}を追記、数値はミリ秒指定
  await page.type('input[name="userid"]' /*'ログインID'*/);
  await page.type('input[name="password]' /*'パスワード'*/);
  await page.click('input[type="submit"]');

  await page.goto(
    "/*ログインに成功するとスケジュ-ルのリンクに動的URLが生成されるのでそのURLをここへコピペ",
    { waitUntil: load }
  );

  //スクレイピングの処理
  const data = await page.evaluate(() => {
    //tabletagを特定
    const rows = document.querySelectorAll("table.def tbody tr");

    //テーブル行をループし、各行のデータを抽出
    let result = [];
    rows.forEach((row) => {
      const columns = row.querySelectorAll("th, td");
      //値が一つでもあれば代入
      if (columns.length > 0) {
        result.push({
          date: columns[0]?.innerText.trim() || "",
          day: columns[1]?.innerText.trim() || "",
          start: columns[2]?.innerText.trim() || "",
          end: columns[3].innerText.trim() || "",
          position: columns[4]?.innerText.tirm() || "",
        });
      }
    });
    return result;
  });
}

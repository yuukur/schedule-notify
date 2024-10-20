const puppeteer = require("puppeteer");
const axios = require("axios");
const cron = require("node-cron");

const LINE_NOTIFY_TOKEN =  /*"LINENOTIFYトークン"*/;

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
    rows.forEach((row, index) => {
      //最初の３行は不要
      if (index < 3) return;

      const columns = row.querySelectorAll("th, td");
      //値が一つでもあれば代入
      if (columns.length > 0) {
        result.push({
          date: columns[0]?.innerText.trim() || "",
          day: columns[1]?.innerText.trim() || "",
          start: columns[2]?.innerText.trim() || "",
          end: columns[3]?.innerText.trim() || "",
          position: columns[4]?.innerText.tirm() || "",
        });
      }
    });
    return result;
  });
  //作成した配列データを送信用に整形
  let message = "\n日付 出勤 退勤 ポジション\n\n";

  data.forEach((row, index) => {
    //最後行だけ表示を変更する
    const isLast = index === data.length - 1;

    if (isLast) {
      let formattedRow = `${row.date}(${row.day}) ${row.start || ""} ${
        row.end || ""
      } ${row.position || ""}`;
      message += formattedRow + "\n";
    }

    let formattedRow = `${row.date}(${row.day}) ${row.start || "休み"} ${
      row.end || ""
    } ${row.position || ""}`;
    message += formattedRow + "\n";
  });

  await sendLineMessage(message);
  await browser.close();
}

async function sendLineMessage(message) {
  const url = "https://notify-api.line.me/api/notify";
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: `Bearer ${LINE_NOTIFY_TOKEN}`,
  };


const data = new URLSearchParams();
data.append("message", message);

try {
  const response = await axios.post(url, data, { headers });
  console.log("通知送信成功:", response.data);
} catch (error) {
  console.error("通知送信失敗:", error);
}};

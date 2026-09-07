// 更严谨的Chrome检测，可以排除Opera和Edge等同样基于Chromium的浏览器
var isChromium = (window as any).chrome;
var vendorName = window.navigator.vendor;
var isOpera = window.navigator.userAgent.indexOf('OPR') > -1;
var isIEedge = window.navigator.userAgent.indexOf('Edge') > -1;

// 检测是否为纯正Chrome
var isChrome =
  isChromium !== null &&
  isChromium !== undefined &&
  vendorName === 'Google Inc.' &&
  isOpera == false &&
  isIEedge == false;

if (!isChrome) {
  // 方式一：使用alert弹窗（会阻塞页面，体验一般）
  // alert("我们检测到您当前使用的不是Chrome浏览器，为了获得最佳体验，建议您使用最新版Google Chrome访问。");

  // 方式二：在页面上显示一个醒目的提示条（体验更好，推荐）
  var warningDiv = document.createElement('div');
  warningDiv.style.cssText =
    'position: fixed; top: 0; left: 0; width: 100%; background: #f44336; color: white; text-align: center; padding: 15px; font-size: 16px; z-index: 9999;';
  warningDiv.innerHTML =
    '我们检测到您的浏览器不是 Chrome，大概率你无法查看列表数据。可能存在安全风险或导致页面无法正常显示。建议您使用 <a href="https://www.google.com/chrome/" target="_blank" style="color: #fff; font-weight: bold;">下载最新版Chrome</a> 访问。';
  document.body.prepend(warningDiv);
}

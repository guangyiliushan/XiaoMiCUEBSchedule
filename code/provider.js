function request(tag, url, data) {
  let responseText = '';
  let xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    console.log(xhr.readyState + ' ' + xhr.status);
    if ((xhr.readyState === 4 && xhr.status === 200) || xhr.status === 304) {
      responseText = xhr.responseText;
    }
  };
  xhr.open(tag, url, false);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.send(data);
  return responseText;
}

async function scheduleHtmlProvider(dom = document) {
  await loadTool('AIScheduleTools')
  let resultHtml = '';
  let isIframeFound = true;
  try {
    let iframes = document.getElementsByTagName('iframe');
    for (const element of iframes) {
      const iframeDom = element;
      if (iframeDom.src && iframeDom.src.search('/jsxsd/xskb/xskb_list.do') !== -1) {
        const currentDom = iframeDom.contentDocument;
        resultHtml = currentDom.getElementById('kbtable')
          ? currentDom.getElementById('kbtable').outerHTML
          : currentDom.getElementsByClassName('content_box')[0].outerHTML;
        isIframeFound = false;
      }
    }
    if (isIframeFound) {

      resultHtml = dom.getElementById('kbtable').outerHTML;
    }
    return resultHtml;
  } catch (e) {
    console.error(e);
    let responseHtml = request('get', '/jsxsd/xskb/xskb_list.do', null);
    dom = new DOMParser().parseFromString(responseHtml, 'text/html');
    return dom.getElementById('kbtable')
      ? dom.getElementById('kbtable').outerHTML
      : dom.getElementsByClassName('content_box')[0].outerHTML;
  }
}
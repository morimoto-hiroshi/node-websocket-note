//定数
const URL = 'ws://' + location.host + '/'
const PROTOCOL = 'note'

//グローバル変数
const g_websocket = new WebSocket(URL, PROTOCOL)
var g_focusOutFlag = false
var g_sessionId //セッション識別子

//ロード時の初期化処理
window.onload = function () {
    //背景クリックで新規追加
    document.body.addEventListener('click', (e) => {
        //編集終了のため背景クリックした場合は処理しない
        if (g_focusOutFlag) {
            g_focusOutFlag = false
            return
        }
        //addコマンドを送る（サーバーでunitIdを採番するので、まだdiv追加しない）
        const msg = {
            cmd: 'add',
            unit: {
                text: 'hello',
                posx: e.offsetX,
                posy: e.offsetY,
                updateBy: g_sessionId
            }
        }
        g_websocket.send(JSON.stringify(msg))
    })
}

//WebSocketイベントハンドラ
g_websocket.onopen = function () {
    console.log('open')
}

g_websocket.onmessage = function ( {data:json}) {
    console.log('message: ' + json)
    var data = JSON.parse(json)
    switch (data.cmd) {
        case 'info':
            g_sessionId = data.sessionId
            break;
        case 'add':
        case 'drag':
        case 'update':
            onAddDragUpdate(data)
            break;
        case 'delete':
            document.getElementById(data.unit.unitId).remove()
            break;
    }
}

g_websocket.onerror = function () {
    console.log('error')
}

g_websocket.onclose = function () {
    console.log('close')
}

//add,drag,updateコマンドの処理
function onAddDragUpdate(data) {
    var div = document.getElementById(data.unit.unitId)
    if (!div) {
        //ロード時の既存データ受信か、または自セッションからaddした場合。ここでdiv生成する。
        div = document.createElement('div')
        div.id = data.unit.unitId
        div.className = 'unit'
        div.contentEditable = true
        document.body.append(div)
        div.addEventListener('click', (e) => {
            e.stopPropagation() //bodyに届くと新規追加が動くので止める
        })
        div.addEventListener('input', (e) => {
            sendUpdate(false)
        })
        div.addEventListener('focusin', (e) => {
            addCloseButton()
        })
        div.addEventListener('focusout', (e) => {
            removeCloseButton()
            g_focusOutFlag = true
        })
        setDraggable(div, (x, y) => { //ドラッグ中
            removeCloseButton()
            sendUpdate(true)
        }, (x, y, moved) => { //ドラッグ終了
            if (moved) {
                sendUpdate(false)
            }
        })
    } else {
        //自セッションから送った更新情報はスルー
        if (data.unit.updateBy == g_sessionId) {
            return
        }
    }
    //更新情報を反映
    div.innerText = data.unit.text
    div.style.left = data.unit.posx + 'px'
    div.style.top = data.unit.posy + 'px'

    //updateコマンドを送る
    function sendUpdate(isDrag) {
        const msg = {
            cmd: isDrag ? 'drag' : 'update',
            unit: {
                unitId: div.id,
                text: div.innerText,
                posx: div.style.left.replace('px', ''),
                posy: div.style.top.replace('px', ''),
                updateBy: g_sessionId
            }
        }
        g_websocket.send(JSON.stringify(msg))
    }

    function addCloseButton() {
        div.insertAdjacentHTML('beforebegin', `<div class="close-button">✖</div>`)
        const btn = document.querySelector('.close-button')
        btn.style.left = div.style.left
        btn.style.top = div.style.top
        btn.addEventListener('mousedown', (e) => { //click時はunit.focusoutにより先にremoveCloseButton()されるのでmousedownで検知する
            //deleteコマンドを送る
            const msg = {
                cmd: 'delete',
                unit: {
                    unitId: div.id,
                    updateBy: g_sessionId
                }
            }
            g_websocket.send(JSON.stringify(msg))
        })
    }

    function removeCloseButton() {
        const btn = document.querySelector('.close-button')
        if (btn) {
            btn.remove()
        }
    }
}

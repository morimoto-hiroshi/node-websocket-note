/**
 * エレメントをドラッグ可能にする
 */
function setDraggable(ele, onmove, onend) {
    //クロージャのコンテキスト変数
    let m_moved = false;
    let m_offsetX, m_offsetY;

    //開始イベントハンドラを設定
    ele.addEventListener('mousedown', onStart);
    ele.addEventListener('touchstart', onStart);
    ele.style.cursor = 'move';

    //ドラッグ開始イベントハンドラ
    function onStart(e) {
        //目印としてクラス名を追加
        this.classList.add('drag');
        const event = trimEvent(e);
        m_offsetX = event.pageX - this.offsetLeft;
        m_offsetY = event.pageY - this.offsetTop;
        //移動／終了イベントハンドラを設定
        document.body.addEventListener('mousemove', onMove);
        document.body.addEventListener('touchmove', onMove);
        document.body.addEventListener('mouseleave', onEnd);
        document.body.addEventListener('touchleave', onEnd);
        this.addEventListener('mouseup', onEnd);
        this.addEventListener('touchend', onEnd);
    }

    //ドラッグ移動イベントハンドラ
    function onMove(e) {
        m_moved = true;
        let drag = document.getElementsByClassName('drag')[0];
        e.preventDefault();
        const pos = getCornerPos(e);
        drag.style.left = pos.x + 'px';
        drag.style.top = pos.y + 'px';
        if (onmove) {
            onmove(pos.x, pos.y);
        }
    }

    //ドラッグ終了イベントハンドラ
    function onEnd(e) {
        let drag = document.getElementsByClassName('drag')[0];
        //イベントハンドラを撤去
        document.body.removeEventListener('mousemove', onMove);
        document.body.removeEventListener('touchmove', onMove);
        document.body.removeEventListener('mouseleave', onEnd);
        document.body.removeEventListener('touchleave', onEnd);
        drag.removeEventListener('mouseup', onEnd);
        drag.removeEventListener('touchend', onEnd);
        //目印のクラス名を消去
        drag.classList.remove('drag');
        const pos = getCornerPos(e);
        if (onend) {
            onend(pos.x, pos.y, m_moved);
        }
        m_moved = false;
    }

    //マウスまたはタッチイベントを共通化
    function trimEvent(e) {
        return e.type.startsWith('mouse') ? e : e.changedTouches[0];
    }

    //エレメントの左上隅の位置を取得
    function getCornerPos(e) {
        const event = trimEvent(e);
        return {x: event.pageX - m_offsetX, y: event.pageY - m_offsetY};
    }
}

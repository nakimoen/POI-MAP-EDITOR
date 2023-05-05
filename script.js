'use strict';
//TODO: 構造整理

document.getElementById('gpx-file').addEventListener('click', function () {
  if (window.GPX_LOADED) {
    if (confirm('新たにGPXファイルを読み込むと、現在の状態が全て消えます。')) {
      location.reload();
    } else {
      return;
    }
  }
});
document.getElementById('gpx-file').addEventListener('change', function () {
  const file = this.files[0];
  document.getElementById('gpx-file-message').textContent = file
    ? `${file.name}(${file.size / 1000}KB)`
    : 'ファイルが選択されていません';
  if (file) {
    loadGPX(map, function (e) {
      document.querySelector(
        '#wrapper-graph table tr:nth-child(1) td'
      ).textContent = window.GPX_INFO.distance;
      document.querySelector(
        '#wrapper-graph table tr:nth-child(2) td'
      ).textContent = window.GPX_INFO.ascent;
      document.querySelector(
        '#wrapper-graph table tr:nth-child(3) td'
      ).textContent = window.GPX_INFO.descent;

      showGraph();
    });
  }
});
/**
 * @typedef {Object} LatLng
 * @prop {string|number} lat 緯度
 * @prop {string|number} lng 経度
 */

/**
 * 文字列が緯度・経度の形式か否か
 * @param {string} string
 */
function isLatLngString(string) {
  return /^\d{1,3}\.\d{2,}$/.test(string);
}

const map = L.map('map').setView([35.68148019312498, 139.7671569845131], 8);
let MARKER_LIST = [];
let NEXT_MARKER_ID = 0;

// マップのタイル設定
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

/**
 * マップ中央部にクロスマーカー
 */
const cross = L.divIcon({
  className: 'cross',
  bgPos: [18, 18],
});
const crossMark = L.marker(map.getCenter(), {
  icon: cross,
  zIndexOffset: 100,
  interactive: false,
}).addTo(map);

map.on('move', function () {
  // mousemoveイベントでマーカを移動
  crossMark.setLatLng(map.getCenter());
});

/**
 * マップにマーカーを追加する
 * @param {LatLng} latlng 緯度・経度
 * @param {string|null} text POI名
 */
function addMarker(latlng, text) {
  const marker = L.marker(latlng, { draggable: true })
    .addTo(map)
    .on('click', onMarkerClick)
    .on('dragend', onMarkerDragEnd);
  // マーカーの管理用ＩＤの設定
  marker.id = NEXT_MARKER_ID++;
  // マーカーをマーカー管理用配列に追加
  MARKER_LIST.push(marker);
  // マーカー一覧テーブルにマーカー情報の行を追加
  MarkerTable.addRow(marker.id, latlng, text);
}

/**
 * マップからマーカーを削除する
 * @param {string|number} id マーカー管理用ＩＤ
 */
function removeMarker(id) {
  // マーカー管理用配列から引数のＩＤに合致するものを抽出
  const marker = MARKER_LIST.filter((x) => x.id == id)[0];
  // マーカー管理用配列から該当マーカーが見つかったら、マーカーを削除
  // TODO: マーカーが見つからない場合のエラー処理
  if (marker) {
    marker.remove();
    MARKER_LIST = MARKER_LIST.filter((x) => x.id != id);
  }
}

/**
 * マップがクリックされた時
 * @param {*} e leaflet のイベントオブジェクト
 */
function onMapCLick(e) {
  addMarker(e.latlng);
}

/**
 * マーカーがクリックされた時
 * @param {*} e
 */
function onMarkerClick(e) {
  //TODO: popup
  const id = e.target.id;
  MarkerTable.clearActive();
  MarkerTable.setActive(id);
}

/**
 * マーカーのドラッグ終了時
 * @param {*} e
 */
function onMarkerDragEnd(e) {
  const marker = e.target;
  const latlng = marker.getLatLng();
  // マーカーのドラッグによる情報更新をマーカー一覧テーブルに反映する
  MarkerTable.updateMarkerContent(marker.id, latlng);
}
// マップがクリックされた時のイベント処理メソッドの登録
map.on('click', onMapCLick);

//
// マーカー一覧テーブルのなんちゃって拡張用クラス
// マップ関連のイベント以外からのアクセスでは、コードが煩雑になるので注意。
// （※削除は除く：削除はマーカー一覧テーブルからのユーザアクションを要求するため）
//
class MarkerTable {
  static #table = document.getElementById('marker-table');
  static getTable() {
    return this.#table;
  }

  static setActive(id) {
    const tr = Array.from(this.#table.querySelectorAll('tbody tr')).filter(
      (x) => x.dataset['id'] == id
    )[0];
    if (tr) {
      tr.classList.add('active');
    }
  }
  static clearActive() {
    document.querySelectorAll('#marker-table tbody tr').forEach((tr) => {
      tr.classList.remove('active');
    });
  }
  /**
   *
   * @param {number|string} id
   * @param {LatLng} latlng
   * @param {string|null} title
   */
  static addRow(id, latlng, title) {
    this.clearActive();
    const newRow = document
      .querySelector('#template-marker-table-row-content')
      .content.firstElementChild.cloneNode(true);
    newRow.dataset['id'] = id;
    newRow.querySelector('.lat').value = latlng.lat;
    newRow.querySelector('.lng').value = latlng.lng;
    if (title) newRow.querySelector('.title').value = title;

    this.#table.querySelector('tbody').appendChild(newRow);
  }
  static removeRow(button) {
    const tr = button.closest('tr');
    removeMarker(tr.dataset['id']);
    tr.remove();
    return false;
  }
  static updateMarkerContent(id, latlng, title) {
    const row = this.#table.querySelector('tr[data-id="' + id + '"]');
    row.querySelector('.lat').value = latlng.lat;
    row.querySelector('.lng').value = latlng.lng;
    if (title) row.querySelector('.title').value = title;
  }

  /**
   * @typedef MarkerInfo
   * @prop {string} lat
   * @prop {string} lng
   * @prop {string} title
   */
  /**
   *
   * @returns {Array<MarkerInfo>}
   */
  static getMarkers() {
    return Array.from(this.#table.querySelectorAll('tbody tr')).reduce(
      (acc, tr) => {
        const [lat, lng, title] = [
          tr.querySelector('.lat').value,
          tr.querySelector('.lng').value,
          tr.querySelector('.title').value,
        ];
        acc.push({ lat, lng, title });
        return acc;
      },
      []
    );
  }
}

function onMarkerTableRowClick(tr) {
  MarkerTable.clearActive();
  tr.classList.add('active');
  const id = tr.dataset['id'];
  const marker = MARKER_LIST.filter((x) => x.id == id)[0];
  if (marker) {
    const latlng = marker.getLatLng();
    map.flyTo(latlng);
  }
}
function onLatLngEdited(input) {
  const [lat, lng] = input.value.split(',');
  if (!lat || !lng) {
    return;
  }
  const td = input.closest('td');
  td.querySelector('.lat').value = lat.trim();
  td.querySelector('.lng').value = lng.trim();

  input.value = null;
}

/**
 *
 * @param {LatLng} latlng
 */
function setMarkerLatLng(id, latlng) {
  const marker = MARKER_LIST.filter((x) => x.id == id)[0];
  if (marker) {
    const newlatlng = marker.getLatLng();
    if (latlng.lat) {
      newlatlng.lat = latlng.lat;
    }
    if (latlng.lng) {
      newlatlng.lng = latlng.lng;
    }
    marker.setLatLng(newlatlng);
  }
}
function onChangeLng(input) {
  const id = input.closest('tr').dataset['id'];
  setMarkerLatLng(id, { lng: input.value });
}
function onChangeLat(input) {
  const id = input.closest('tr').dataset['id'];
  setMarkerLatLng(id, { lat: input.value });
}

// csv形式での一括読み込み
function loadCSV() {
  const csvText = document.getElementById('csv-text').value;
  if (!csvText) {
    return alert('csvを読み込めませんでした');
  }

  // 各行処理
  csvText.split('\n').forEach((row) => {
    const [lat, lng, title] = row.split(',');
    let flag = isLatLngString(lat) && isLatLngString(lng);
    if (flag) {
      addMarker(
        { lat: lat.trim(), lng: lng.trim() },
        title ? title.trim() : null
      );
    }
  });
}
document.querySelector('#csv-insert-button').addEventListener('click', loadCSV);

//
// 出力
//

function download(str, filename) {
  // ダウンロード
  const blob = new Blob([str], { type: 'text/xml' });
  const link = document.createElement('a');
  link.download = 'poi_included_' + filename;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}

function onExport() {
  const type = document.querySelector(
    'input[name="download-type"]:checked'
  ).value;
  const gpxeditor = new GpxEditor(window.GPX_TEXT);
  if (!gpxeditor.getValid()) {
    alert('ファイルを読み込めませんでした。');
    return;
  }
  const { xmlstring, filename } = ((type) => {
    if (type == 'gpx') return gpxeditor.exportGpx();
    else if (type == 'cnx') return exportCNX();
    return null;
  })(type);
  if (!xmlstring || !filename) return alert('ファイルの出力に失敗しました');
  download(xmlstring, filename);
}

function exportCNX() {
  const points = Array.from(
    MarkerTable.getTable().querySelectorAll('tbody tr')
  ).reduce((acc, tr) => {
    acc.push({
      lat: tr.querySelector('.lat').value,
      lng: tr.querySelector('.lng').value,
      title: tr.querySelector('.title').value,
    });
    return acc;
  }, []);
  const cnxstr = new CNX(window.GPX_TEXT).parseGPX({
    ascent: window.GPX_INFO.ascent,
    descent: window.GPX_INFO.descent,
    distance: window.GPX_INFO.distance,
    points: points,
  });
  return { xmlstring: cnxstr, filename: 'cnx_route.cnx' };
}

function showGraph() {
  const eledata = window.ELEVATION_DATA;

  let tmpDistance = 0;
  const dataPoints = eledata.reduce((acc, cur) => {
    const distance = parseInt(cur[0] * 10);

    if (tmpDistance != distance) {
      acc.push([distance / 10, cur[1]]);
      tmpDistance = distance;
    }
    return acc;
  }, []);

  const chart = Highcharts.chart('graph-container', {
    chart: {
      type: 'spline',
    },
    title: {
      text: '距離―標高',
    },
    yAxis: {
      title: {
        text: '標高',
      },
    },
    xAxis: {
      title: {
        text: '距離',
      },
    },
    series: [{ name: '標高', data: dataPoints }],
  });
}

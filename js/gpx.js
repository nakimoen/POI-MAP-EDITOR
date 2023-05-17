'use strict';
//TODO: クラス化
window.GPX_TEXT = null;
/**
 * @typedef {Object} GpxInfo
 * @prop {string} distance
 * @prop {string} ascent
 * @prop {string} descent
 */
/**
 * @type {GpxInfo}
 */
window.GPX_INFO = null;

/**
 * @type {Array<string[]|number[]>}
 * @description 0:累積標高,1:標高, 2:距離
 */
window.ELEVATION_DATA = [];

window.ELEVATION_MAX = 0;

window.GPX_LOADED = false;
// gpx ファイル読み込み
function loadGPX(map, onloaded) {
  lockWindow();

  const file = document.getElementById('gpx-file').files[0];
  const reader = new FileReader();
  reader.onload = () => {
    // const pre = document.getElementById('pre1');
    // pre.innerHTML = reader.result;
    const gpxText = reader.result;
    window.GPX_TEXT = gpxText;
    new L.GPX(reader.result, {
      async: true,
      marker_options: {
        wptIconUrls: {
          '': 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        },
        shadowUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        startIconUrl: '/pin-icon-start.png',
        endIconUrl: '/pin-icon-end.png',
        // shadowUrl: 'pin-shadow.png',
      },
    })
      .on('loaded', function (e) {
        const target = e.target;
        map.fitBounds(target.getBounds());
        window.GPX_INFO = {
          distance: target.get_distance(),
          ascent: target.get_elevation_gain(),
          descent: target.get_elevation_loss(),
        };

        window.ELEVATION_DATA = target.get_elevation_data();
        window.ELEVATION_MAX = target.get_elevation_max();

        window.GPX_LOADED = true;
        if (onloaded) onloaded(target);

        unlockWindow();
      })
      .on('addpoint', function (e) {
        if (e.point_type == 'waypoint') {
          // marker object
          const marker = e.point;
          // ドラッグの有効化
          marker.options.draggable = true;

          // マーカーのサイズ
          marker.options.icon.options.iconSize = [25, 41];
          // マーカー管理用IDの設定
          const id = NEXT_MARKER_ID++;
          marker.id = id;

          //マーカー配列に追加
          MARKER_LIST.push(marker);
          // マーカー一覧テーブルに表示
          MarkerTable.addRow(id, marker.getLatLng(), marker.options.title);
        }
      })
      .addTo(map);
  };

  reader.readAsText(file);
}

class GpxEditor {
  /**
   * @type {string} gpx
   */
  #gpx;
  /**
   * @type {string} filename
   */
  #filename;

  /**
   * @type {boolean} valid
   */
  #valid;
  /**
   *
   * @param {string} gpx gpx text
   */
  constructor(gpx) {
    // HACK: インスタンス生成失敗
    this.#gpx = gpx;
    const file = document.getElementById('gpx-file').files[0];
    if (file) {
      this.#filename = file.name;
    }
    this.#valid = gpx && file;
  }

  getValid() {
    return this.#valid;
  }
  setGpx(gpxText) {
    this.#gpx = gpxText;
  }

  getGpx() {
    return this.#gpx;
  }

  exportGpx() {
    if (!this.#gpx) {
      return alert('[0]出力に失敗しました。');
    }
    const xmlstring = this.#edit();

    return { xmlstring, filename: this.#filename };
  }

  #edit = function () {
    // waypoint 削除
    const xml = new DOMParser().parseFromString(this.#gpx, 'text/xml');
    xml.querySelectorAll('wpt').forEach((wpt) => {
      wpt.remove();
    });

    // マーカー一覧取得,　xmlに追加
    const markers = MarkerTable.getMarkers();
    markers.forEach((marker, ind) => {
      const doc = new DOMParser().parseFromString(
        `<wpt lat="${marker.lat}" lon="${marker.lng}">
        <ele>0</ele>
        <name>${marker.title}</name>
        <type>CHECKPOINT</type>
        </wpt>
        `,
        'text/xml'
      );
      const wpt = doc.querySelector('wpt');

      xml.querySelector('trk').insertAdjacentElement('beforebegin', wpt);
    });

    // HACK: wptタグの xmlns属性の消し方
    const xmlstring = new XmlBeautify()
      .beautify(new XMLSerializer().serializeToString(xml), {
        indent: '  ',
      })
      .replace(/xmlns="" /g, '');

    return xmlstring;
  };
}

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
function loadGPX(map, file, onloaded, onaddpoint) {
  const reader = new FileReader();
  reader.onload = () => {
    const gpxText = reader.result;
    loadGPXText(map, gpxText, onloaded, onaddpoint);
  };
  reader.readAsText(file);
}
function loadGPXText(map, text, onloaded, onaddpoint) {
  // const pre = document.getElementById('pre1');
  // pre.innerHTML = reader.result;
  window.GPX_TEXT = text;

  const points = [];
  new L.GPX(text, {
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
    })
    .on('addpoint', function (e) {
      points.push(e);
      if (onaddpoint) onaddpoint(e);
    })
    .addTo(map);
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
   * @param {File} file
   */
  constructor(gpx, file) {
    // HACK: インスタンス生成失敗
    this.#gpx = gpx;
    if (file) {
      this.#filename = file.name;
    }
    this.#valid = gpx && file;
  }

  getValid() {
    return this.#valid;
  }
  /**
   *
   * @param {string} gpxText
   */
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

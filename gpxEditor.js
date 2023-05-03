'use strict';
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

    const xmlstring = new XmlBeautify()
      .beautify(new XMLSerializer().serializeToString(xml), {
        indent: '  ',
      })
      .replace(/xmlns="" /g, '');

    return xmlstring;
  };
}

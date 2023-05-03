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

    // ダウンロード
    const blob = new Blob([xmlstring], { type: 'text/xml' });
    const link = document.createElement('a');
    link.download = 'poi_included_' + this.#filename;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
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
      const wpt = xml.createElement('wpt');
      wpt.setAttribute('lat', marker.lat);
      wpt.setAttribute('lng', marker.lng);

      const ele = xml.createElement('ele');
      ele.textContent = '0';
      wpt.appendChild(ele);

      const name = xml.createElement('name');
      name.textContent = marker.title;
      wpt.appendChild(name);

      const type = xml.createElement('type');
      type.textContent = 'CHECKPOINT';
      wpt.appendChild(type);

      xml.querySelector('trk').insertAdjacentElement('beforebegin', wpt);
    });

    const xmlstring = new XmlBeautify().beautify(
      new XMLSerializer().serializeToString(xml),
      {
        indent: '  ',
      }
    );

    return xmlstring;
  };
}

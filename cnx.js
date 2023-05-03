'use strict';

class CNX {
  #gpxtext;
  /**
   *
   * @param {string} gpxtext gpx のテキスト
   */
  constructor(gpxtext) {
    this.#gpxtext = gpxtext;
  }

  /**
   * @typedef {Object} point
   * @prop {string} lat latitude
   * @prop {string} lng longitude
   * @prop {string} title title
   */
  /**
   * @typedef {Object} gpxInfo
   * @prop {string|number} distance
   * @prop {string|number} ascent
   * @prop {string|number} descent
   * @prop {Array<point>} points
   */
  /**
   *
   * @param {gpxInfo} arg
   * @returns {string} cnx string
   */
  parseGPX(arg) {
    const document = new DOMParser().parseFromString(this.#gpxtext, 'text/xml');
    const trk = document.querySelector('trk');

    const cnx = new DOMParser().parseFromString('<Route></Route>', 'text/xml');

    const trkpts = Array.from(trk.querySelectorAll('trkseg trkpt'));
    const tracksStr = trkpts.reduce((acc, trkpt) => {
      const lat = trkpt.getAttribute('lat');
      const lng = trkpt.getAttribute('lon');
      const ele = ((elevation) => {
        return parseInt((elevation * 10000) / 100);
      })(trkpt.querySelector('ele').textContent);

      return acc + `${lat},${lng},${ele};`;
    }, '');

    function insert(root, appendTo, tags) {
      tags.forEach((item) => {
        const dom = root.createElement(item.tag);
        if (item.value) dom.textContent = item.value;
        root.querySelector(appendTo).appendChild(dom);
      });
    }
    insert(cnx, 'Route', [
      { tag: 'Id', value: null },
      { tag: 'Distance', value: arg.distance },
      { tag: 'Duration', value: null },
      { tag: 'Ascent', value: arg.ascent },
      { tag: 'Descent', value: arg.descent },
      { tag: 'Encode', value: '0' },
      { tag: 'Lang', value: '0' },
      { tag: 'TracksCount', value: '' + trkpts.length },
      { tag: 'Trakcs', value: tracksStr },
    ]);

    const pc = cnx.createElement('PointsCount');
    pc.textContent = arg.points.length;
    cnx.querySelector('Route').appendChild(pc);

    const pointsdom = cnx.createElement('Points');
    arg.points.forEach((point) => {
      const pointdom = cnx.createElement('Point');

      const latdom = cnx.createElement('Lat');
      latdom.textContent = point.lat;
      const lngdom = cnx.createElement('Lon');
      lngdom.textContent = point.lng;
      const descdom = cnx.createElement('Descr');
      descdom.textContent = point.title;
      const typedom = cnx.createElement('Type');
      typedom.textContent = 0;

      pointdom.appendChild(latdom);
      pointdom.appendChild(lngdom);
      pointdom.appendChild(descdom);
      pointdom.appendChild(typedom);

      pointsdom.appendChild(pointdom);
    });
    cnx.querySelector('Route').appendChild(pointsdom);

    return (
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      new XmlBeautify().beautify(new XMLSerializer().serializeToString(cnx), {
        indent: '  ',
      })
    );
  }
}

/** TCX xsd
 * <xsd:simpleType name="CoursePointType_t">
<xsd:restriction base="Token_t">
<xsd:enumeration value="Generic"/>
<xsd:enumeration value="Summit"/>
<xsd:enumeration value="Valley"/>
<xsd:enumeration value="Water"/>
<xsd:enumeration value="Food"/>
<xsd:enumeration value="Danger"/>
<xsd:enumeration value="Left"/>
<xsd:enumeration value="Right"/>
<xsd:enumeration value="Straight"/>
<xsd:enumeration value="First Aid"/>
<xsd:enumeration value="4th Category"/>
<xsd:enumeration value="3rd Category"/>
<xsd:enumeration value="2nd Category"/>
<xsd:enumeration value="1st Category"/>
<xsd:enumeration value="Hors Category"/>
<xsd:enumeration value="Sprint"/>
</xsd:restriction>
</xsd:simpleType>
 */

/**
 * @typedef {Object} LatLon
 * @prop {string} lat
 * @prop {string} lon
 */
/**
 * @typedef {Object} TcxCoursePoint
 * @prop {LatLon} latlon
 * @prop {string} type
 * @prop {string} text
 */
class TcxController {
  /**
   * @type {string}
   */
  #tcxText;
  /**
   *
   * @param {string} tcxtext
   */
  constructor(tcxtext) {
    this.#tcxText = tcxtext;
  }

  /**
   *
   * @param {Document} doc
   * @param {string|number} lat
   * @param {string|number} lon
   * @param {string|number} ele
   */
  #createTrkpt(doc, lat, lon, ele) {
    const trkptdom = doc.createElement('trkpt');
    trkptdom.setAttribute('lat', lat);
    trkptdom.setAttribute('lon', lon);

    const eledom = doc.createElement('ele');
    eledom.textContent = ele;

    trkptdom.appendChild(eledom);

    return trkptdom;
  }

  /**
   *
   * @returns {string} gpx text
   */
  toGpx() {
    const gpxdoc = new DOMParser().parseFromString(
      '<?xml version="1.0" encoding="UTF-8"?><gpx><trk><trkseg></trkseg></trk></gpx>',
      'application/xml'
    );

    const trksegDom = gpxdoc.querySelector('trkseg');

    const tcxdoc = new DOMParser().parseFromString(
      this.#tcxText,
      'application/xml'
    );

    // Track
    tcxdoc
      .querySelectorAll('Courses > Course > Track > Trackpoint')
      .forEach((trkpoint) => {
        const lat = trkpoint.querySelector(
          'Position > LatitudeDegrees'
        ).textContent;
        const lon = trkpoint.querySelector(
          'Position > LongitudeDegrees'
        ).textContent;
        const ele = trkpoint.querySelector('AltitudeMeters').textContent;

        trksegDom.appendChild(this.#createTrkpt(gpxdoc, lat, lon, ele));
      });

    // CoursePoint
    tcxdoc
      .querySelectorAll('Courses > Course > CoursePoint')
      .forEach((point) => {
        const lat = point.querySelector(
          'Position > LatitudeDegrees'
        ).textContent;
        const lon = point.querySelector(
          'Position > LongitudeDegrees'
        ).textContent;
        const type = point.querySelector('PointType').textContent;
        const text = point.querySelector('Notes').textContent;

        const latlon = { lat, lon };

        const wptdoc = new DOMParser().parseFromString(
          `<wpt lat="${lat}" lon="${lon}">
          <ele>0</ele>
          <name>${text}</name>
          <type>GENERIC</type>
          </wpt>
          `,
          'application/xml'
        );
        const wpt = wptdoc.querySelector('wpt');

        gpxdoc.querySelector('trk').insertAdjacentElement('beforebegin', wpt);
      });

    return new XMLSerializer().serializeToString(gpxdoc);
  }
}

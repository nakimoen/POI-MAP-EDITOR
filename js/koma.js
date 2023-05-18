class KomazuGenerator {
  #koma_points = [];

  /**
   * @type {Document}
   */ #_document;

  /**
   * @type {Boolean}
   */
  #generateFlag;

  /**
   *
   * @param {Document} targetDocument
   */
  constructor(targetDocument) {
    this.#generateFlag = true;
    // no print elements
    if (targetDocument) {
      this.#_document = targetDocument;
      this.#_document
        .querySelectorAll(
          // '.leaflet-pane.leaflet-overlay-pane, .leaflet-marker-icon.cross'
          '.leaflet-marker-icon.cross'
        )
        .forEach((elem) => {
          elem.setAttribute('data-html2canvas-ignore', 'true');
        });
    }
  }

  /**
   *
   * @param {string} tcxtext tcxファイルのテキスト
   */
  loadtcx(tcxtext, onfoundpoint) {
    this.#koma_points.splice(0);
    const doc = new DOMParser().parseFromString(tcxtext, 'text/xml');
    const points = doc.querySelectorAll('CoursePoint');
    points.forEach((point) => {
      /* MEMO: TCX一部メモ
      <CoursePoint>
        <Name>End of rou</Name>
        <Time>2023-05-23T20:31:21Z</Time>
        <Position>
          <LatitudeDegrees>33.24996</LatitudeDegrees>
          <LongitudeDegrees>131.86527</LongitudeDegrees>
        </Position>
        <PointType>Generic</PointType>
        <Notes>End of route</Notes>
      </CoursePoint>
    */
      const lng = point.querySelector('LongitudeDegrees').textContent;
      const lat = point.querySelector('LatitudeDegrees').textContent;
      const text = point.querySelector('Notes').textContent;
      const type = point.querySelector('PointType').textContent;

      const pointitem = {
        type,
        text,
        latlng: { lat, lng },
      };
      this.#koma_points.push(pointitem);
      if (onfoundpoint) onfoundpoint(pointitem);
    });
  }

  /**
   *
   * @param {*} map leafletのmapオブジェクト
   * @param {string|number} interval コマ図対象地点の画像化のインターバル（mill seconds）
   */
  async makeKomaArticle(map, interval) {
    this.#_document
      .querySelectorAll('#wrapper-koma > article > section')
      .forEach((elem) => elem.remove());

    const linesLayer = this.#_document.querySelector(
      'svg.leaflet-zoom-animated'
    );
    const mapWidth = parseFloat(
      this.#_document.querySelector('#map').clientWidth
    );
    const mapHeight = parseFloat(
      this.#_document.querySelector('#map').clientHeight
    );
    const target = this.#_document.querySelector('#map');

    const oldLinesWidth = linesLayer.getAttribute('width');
    const oldLinesHeight = linesLayer.getAttribute('height');
    const oldViewbox = linesLayer.getAttribute('viewBox');
    const viewBoxValue = '0 0 ' + mapWidth + ' ' + mapHeight;

    const linesTransform = linesLayer.style.transform.split(',');
    const linesX = parseFloat(
      linesTransform[0].split('(')[1].replace('px', '')
    );
    const linesY = parseFloat(linesTransform[1].replace('px', ''));

    const koma_dom_arr = new Array();

    for await (const point of this.#koma_points) {
      if (!this.#generateFlag) break;

      // マップ位置移動
      const latlng = point.latlng || point.latlon;
      map.setView({ lat: point.lat, lng: point.lng }, 19);

      // TODO: できたらタイル読み込み完了イベントとりたい
      await sleep(interval);

      const size = {
        width: 200,
        height: 200,
      };

      // TODO: 位置ずれ修正
      linesLayer.setAttribute('width', mapWidth);
      linesLayer.setAttribute('height', mapHeight);
      linesLayer.setAttribute('viewBox', viewBoxValue);

      linesLayer.style.transform = '';
      linesLayer.style.left = '';
      linesLayer.style.top = '';

      await html2canvas(target, {
        useCORS: true,
        height: size.height,
        width: size.width,
        x: target.clientWidth / 2 - size.width / 2,
        y: target.clientHeight / 2 - size.height / 2,
        scrollX: 0,
        scrollY: -window.scrollY,
      }).then((canvas) => {
        const container = this.#_document.createElement('div');
        container.classList.add('koma');
        container.innerHTML = '<textarea>' + point.text + '</textarea>';
        container.prepend(canvas);
        koma_dom_arr.push(container);
      });
    } // EO for

    // 位置ずれ調整後の復元処理
    linesLayer.style.transform = 'translate(' + linesX + 'px,' + linesY + 'px)';
    linesLayer.setAttribute('viewBox', oldViewbox);
    linesLayer.setAttribute('width', oldLinesWidth);
    linesLayer.setAttribute('height', oldLinesHeight);

    // コマ図用セクション（A4サイズフォーマット）生成
    const koma_chunk = koma_dom_arr.chunk(20);
    koma_chunk.forEach((koma_list) => {
      const section = this.#_document.createElement('section');
      section.classList.add('a4');

      koma_list.forEach((koma) => {
        section.appendChild(koma);
      });

      this.#_document
        .querySelector('#wrapper-koma > article')
        .appendChild(section);
    });

    return;
  }

  async makeKomaArticleByPoints(map, interval, points) {
    this.#koma_points.splice(0);
    this.#koma_points = new Array(...points);
    return this.makeKomaArticle(map, interval);
  }
}

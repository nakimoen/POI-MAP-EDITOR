'use strict';
window.GPX_TEXT = null;
// gpx ファイル読み込み
function loadGPX() {
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
      },
    })
      .on('loaded', function (e) {
        map.fitBounds(e.target.getBounds());
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
document.getElementById('load-gpx-button').addEventListener('click', loadGPX);

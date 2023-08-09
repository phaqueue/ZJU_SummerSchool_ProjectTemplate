import React, { Component } from 'react';

import echarts from 'echarts/lib/echarts';
// 引入热力图
import 'echarts/lib/chart/heatmap';
// 引入提示框和标题组件
import 'echarts/lib/component/tooltip';
import 'echarts/lib/component/title';
import 'echarts/extension/bmap/bmap';
import 'echarts/lib/component/visualMap';

class EchartsTest extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: props.data,
    };
  }

  componentDidMount() {
    this.getCharts();
  }

  // 保证再次请求数据时候，地图重新加载
  // eslint-disable-next-line no-unused-vars
  componentWillReceiveProps(nextProps, nextContext) {
    this.setState({
      data: nextProps.data,
    });
    setTimeout(() => {
      if(!nextProps.data.length===0){
        this.getCharts();
      }
    }, 500);
  }

  getCharts = () => {
    const { data } = this.state;
   // 这里data格式：[[120.122,35.666,67],[120.12323,23.45555,23]] ,里面是经度，维度，热力值
    const maxdata = data
      .map(item => item[2])
      .sort()
      .reverse()[0];
    const myChart = echarts.init(document.getElementById('main'));
    const option = {
      animation: false,
      // tooltip: { // 悬浮层提示框在热力图上无效
      //   trigger: 'item',
      //   triggerOn: 'click',
      // },
      bmap: {
        center: [data[0][0], data[0][1]],
        zoom: this.getMapGrade(data),
        roam: true,
      },
      visualMap: {
        show: true,
        // top: 'top',
        bottom: 50,
        left: 0,
        min: 0,
        max: maxdata,
        seriesIndex: 0,
        calculable: true,
        inRange: {
          color: ['blue', 'green', 'yellow', 'red'],
        },
      },
      series: [
        {
          name: 'gid热力值',
          type: 'heatmap',
          coordinateSystem: 'bmap',
          data,
          pointSize: 8,
          blurSize: 8,
        },
      ],
    };
    myChart.setOption(option);
    // 添加百度地图插件
    const bmap = myChart
      .getModel()
      .getComponent('bmap')
      .getBMap();

    // 解决地图放大地图中心点漂移的问题。当地图不在页面顶部使用
    // let cp;
    // bmap.addEventListener("mousemove",function(){ // 加载完成时,触发
    //   cp = bmap.getCenter();
    // });
    // bmap.addEventListener("mouseend",function(){ // 加载完成时,触发
    //   cp = bmap.getCenter();
    // });
    // bmap.addEventListener("tilesloaded",function(){ // 加载完成时,触发
    //   bmap.setCenter(cp);
    // });

    // eslint-disable-next-line no-undef
    bmap.addControl(new BMap.NavigationControl()); // 地图平移缩放控件
    // eslint-disable-next-line no-undef
    bmap.addControl(new BMap.ScaleControl()); // 地图比例尺控件
    // 创建一个标注
    // var point = new BMap.Point(data[0][0], data[0][1]);
    // var marker = new BMap.Marker(point);  // 创建标注
    // bmap.addOverlay(marker);
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < data.length; i++) {
      // eslint-disable-next-line no-undef
      const hotPoint = new BMap.Point(data[i][0], data[i][1]);
      // eslint-disable-next-line no-undef
      const marker = new BMap.Marker(hotPoint); // 创建标注
      bmap.addOverlay(marker); // 将标注添加到地图中

      // eslint-disable-next-line no-use-before-define
      // marker.addEventListener("click",getAttr);
      // function getAttr(){
      //   var p = marker.getPosition();       // 获取marker的位置
      //   p.id = "123";
      //   console.log("点的位置是" + hotPoint.lng + "," + hotPoint.lat);
      //   console.log("marker的位置是" + p.lng + "," + p.lat);
      // }

      // eslint-disable-next-line no-undef
      const infoWindow = new BMap.InfoWindow(`
        <div style="margin:0;line-height:20px;padding:2px;">
          标题：热点详细信息
          <br/>地理位置：${data[i][0]}, ${data[i][1]}
          <br/>最近三个月热力值：${data[i][2]}
        </div>`);

      marker.infoWindow = infoWindow; // 给当前标注新增一个属性以便保存窗口信息infoWindow
      marker.addEventListener('click', function(e) {
        this.openInfoWindow(e.target.infoWindow); // 点击标注时，打开改标注对打开改标注对应的回调信息
        // 如果使用下面的方式，那样就会导致每次标注点击后，弹出的窗口信息都是最后一次循环的infoWindow。因为在click的时候只会去找infoWindow这个变量值，而你的click肯定是在所有循环的，标注都产生完之后，此时infoWindow变量已经被赋值成了最后一次循环的值。
        // this.openInfoWindow(infoWindow);
      });
    }
    // eslint-disable-next-line no-undef
    bmap.addControl(
      // eslint-disable-next-line no-undef
      new BMap.MapTypeControl({
        mapTypes: [
          // eslint-disable-next-line no-undef
          BMAP_NORMAL_MAP,
          // BMAP_HYBRID_MAP
        ],
      })
    );
    // 去掉上面的{mapTypes:[...]}  就会显示地图，卫星，三维三个图层
  };

  // 计算经纬度距离(千米)，四个参数分别是点A的纬度，经度，点B的纬度，经度（位置不要搞错了，我就弄错了，搞了好久）
  getDistance =(lat1, lng1, lat2, lng2)=>{
    const radLat1 = lat1*Math.PI / 180.0;
    const radLat2 = lat2*Math.PI / 180.0;
    const a = radLat1 - radLat2;
    const b = lng1*Math.PI / 180.0 - lng2*Math.PI / 180.0;
    // eslint-disable-next-line no-restricted-properties
    let s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a/2),2) +
      // eslint-disable-next-line no-restricted-properties
      Math.cos(radLat1)*Math.cos(radLat2)*Math.pow(Math.sin(b/2),2)));
    s *=6378.137 ;
    s = Math.round(s * 10000) / 10000;
    return s;
  };

  // 计算地图初始化所有地理坐标中距离最大值
  getZoom = (val)=>{
    const arr = [];
    if(val.length===1){
      arr.push(1)
    }else{
      for(let i=1;i<val.length;i+=1){
        arr.push(this.getDistance(val[0][1],val[0][0],val[i][1],val[i][0]))
      }
    }
  // console.log("所有距离",arr);
    return Math.max(...arr)
  };

  // 计算比例尺对应的百度地图等级
  getMapGrade=(val)=>{
  // console.log("数据 ",val);
    const num=this.getZoom(val);
  //   console.log("最大距离",num);
    let zoom=0;
   if(num<=1){
     zoom=15
   }else if(num>1&&num<=50){
     zoom=10
    }else if(num>50&&num<=100){
     zoom=9
   }else if(num>100&&num<=500){
     zoom=7
   }else if(num>500&&num<=1000){
     zoom=6
   }else{
     zoom=4
   }
   return zoom
  };


  render() {
    return (
      <div id="main" style={{ width: '100%', height: 600 }}></div>
    );
  }
}

export default EchartsTest;
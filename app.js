String.prototype.replaceAll = function(search, replacement) {
  var target = this;
  return target.split(search).join(replacement);
};

var app = angular.module('app', ['ui.bootstrap','ngCookies']);

app.filter("transform", [function() {
  return function(a) {
    return  (Math.round(a * 10000) / 100) + "%";
  }
}]);

app.controller('controller',['$scope','$cookies','fileReader',function ($scope,$cookies, fileReader) {

  $scope.showMoreResults = function(){
    $scope.showMax += 100;
    //show not more than possible
    if($scope.showMax > $scope.bodyDataFiltered.length){
      $scope.showMax = $scope.bodyDataFiltered.length;
    }
  }
  $scope.getClass = function(value,index){
    if($scope.getCellType(index) == "p" || $scope.getCellType(index) == "f"){
      if(parseFloat(value) < 0){
        return "table-danger";
      }else if(parseFloat(value) >= 0){
        return "table-success";
      }

    }
  }
  $scope.addAlert = function(str,t) {
    $scope.alerts.push({msg: str,type:t});
    setTimeout(function () {
      $scope.$apply(function(){
        //close latest after X seconds
        $scope.closeAlert($scope.alerts.length-1);
      });
    }, 2000);
  };

  $scope.closeAlert = function(index) {
    $scope.alerts.splice(index, 1);
  };

  $scope.loadFilter = function(filter){
    $scope.currFilter = filter;
    $scope.addAlert("Filter laddat.","primary");
    $scope.buildFilter();
  }
  $scope.loadSavedFilters = function(){
    var v = $cookies.getObject('savedFilters');
    if(v){
      $scope.savedFilters = v;
    }else{
      $scope.savedFilters = new Array();
    }
  }

  $scope.saveFilter = function(){
    //add currfilter to savedfilters
    if($scope.currFilter.data.length > 0){
      var added = false;
      for(i=0;i<$scope.savedFilters.length;i++){
        if($scope.savedFilters[i].name == $scope.currFilter.name){
          $scope.savedFilters[i].data = $scope.currFilter.data; //updated the saved one.
          added = true;
          break;
        }
      }
      //if not found, save whole filter
      if(!added){
        $scope.savedFilters.push($scope.currFilter);
      }
      //save the cookie
      $cookies.putObject('savedFilters', $scope.savedFilters);
    }
    $scope.loadSavedFilters();
  }

  $scope.createEmptyFilter = function(){
    $scope.currFilter = {name:"Filter-" + Date.now(),id:Date.now(),data:new Array()};
  }

  $scope.removeFilterSaved = function(filter){
    var index = -1;
    for(i=0;i<$scope.savedFilters.length;i++){
      if($scope.savedFilters[i].id == filter.id){
        index = i;
        break;
      }
    }
    if(index != -1){
      $scope.savedFilters.splice(index,1);
      $scope.addAlert("Filter borttaget.","primary");
      $cookies.putObject('savedFilters', $scope.savedFilters);
      $scope.loadSavedFilters();
    }else{
      $scope.addAlert("Kunde ej ta bort filter.","danger");
    }
    //remove
  }


  $scope.addFilter = function(){
    //check if exists?
    var exists = false;
    for(i=0;i<$scope.currFilter.data.length;i++){
      if($scope.selectedFilter &&
        $scope.currFilter.data[i].index == $scope.selectedFilter.index){
          exists = true;
          break;
        }
      }
      if(!exists){
        if($scope.selectedFilter){
          $scope.currFilter.data.push($scope.selectedFilter);
        }else{
          //error
        }
        //call filter function for refiltering
        $scope.filter();
      }else{
        $scope.addAlert("Valda filtret finns redan.","danger");
      }
    }

    $scope.removeFilter = function(index){
      var fi = -1;
      for(i=0;i<$scope.currFilter.data.length;i++){
        if($scope.currFilter.data[i].index == index){
          fi = i;
          break;
        }
      }
      if(fi != -1){
        $scope.currFilter.data.splice(fi,1);
      }
      //call filter function for refiltering
      $scope.filter();
    }

    $scope.filter = function(){
      //
      $scope.bodyDataFiltered = new Array();
      var useFilter = new Array();
      for(i=0;i<$scope.currFilter.data.length;i++){
        if($scope.currFilter.data[i] &&
          ($scope.currFilter.data[i].min || $scope.currFilter.data[i].max || $scope.currFilter.data[i].equal)){
            //user that filter!
            useFilter.push($scope.currFilter.data[i]);
          }
        }
        var include;
        var val;
        if($scope.bodyData)
        for(i=0;i<$scope.bodyData.length;i++){
          include = true;
          for(j=0;j<useFilter.length;j++){
            val = $scope.bodyData[i][useFilter[j].index];

            if(useFilter[j].min){
              if(isNaN(val) || !(parseFloat(val) > parseFloat(useFilter[j].min))){
                include = false;
              }
            }
            if(useFilter[j].max){
              if(isNaN(val) || !(parseFloat(val) < parseFloat(useFilter[j].max))){
                include = false;
              }
            }
            //filter string include
            if(useFilter[j].equal && useFilter[j].equal.length > 0){
              var f = useFilter[j].equal;
              f = f.trim();
              f = f.toLowerCase();
              if(val && val.toLowerCase().indexOf(f) == -1){
                include = false;
              }
            }


          }

          if(include){
            $scope.bodyDataFiltered.push($scope.bodyData[i]);
          }
        }
        //reset showmax
        $scope.saveFilter();
        $scope.showMax = 100;

      }

      $scope.buildFilter = function(){
        //set up filtered data-semver
        var diff=[];
        $scope.filterData = new Array();
        for(i=0;i<$scope.headerData.length;i++){
          $scope.filterData.push({name:$scope.headerData[i]["name"],index:i,type:$scope.headerData[i]["type"]});
        }
        if($scope.currFilter.data.length > 0){
          for(i=0;i<$scope.currFilter.data.length;i++){
            for(j=0;j<$scope.filterData.length;j++){
              if($scope.currFilter.data[i]["name"] == $scope.filterData[j]["name"] &&
              $scope.currFilter.data[i]["index"] == $scope.filterData[j]["index"]){
                diff.push(true);
                break;
              }
            }
          }
        }
        if(!$scope.currFilter.data || diff.length != $scope.currFilter.data.length){
          $scope.createEmptyFilter();
          $scope.addAlert("Inte godkänt filter. Skapar ett nytt","danger");
        }
        $scope.bodyDataFiltered = $scope.bodyData;
        $scope.filter();
      }

      $scope.getCellType = function(index){
        return $scope.headerData[index]["type"];
      }

      $scope.determineCellType = function(cell,index){
        if(cell){
          if((cell.match(/[a-z]/i)) || isNaN(parseFloat(cell))){
            $scope.headerData[index]["type"] = "s";
          }else{
            var t = String(cell).split(".");
            if(t[1] && String(t[1]).trim().length > 3){
              // val = (Math.round(cell * 10000) / 100) + "%";
              $scope.headerData[index]["type"] = "p";
            }
            if($scope.headerData[index]["type"] != "p"){
              $scope.headerData[index]["type"] = "f";
            }

          }
        }
      }


      $scope.getFile = function () {

        var e = document.getElementById("file");
        fileReader.readAsText(e.files[0], $scope)
        .then(function(result) {
          $scope.showResult = true;
          $scope.filterData = new Array();
          $scope.headerData = new Array();
          $scope.bodyData = new Array();
          $scope.bodyDataFiltered = new Array();
          var lines = result.split(String.fromCharCode(13));
          var headers = lines[0].split(";");
          var info = lines[1].split(";");
          var cols = result.split(";");
          var start = headers.length*2;
          var length = headers.length*3;
          var j = 0;
          var c;
          var rows = [];
          rows[0] = [];
          var r = 0;
          var v = null;
          //add all cells
          for(i = start-2;i<cols.length;i++){
            c = cols[i];
            if(j==0){
              var temp = cols[i].split(String.fromCharCode(10));
              c = temp[1];
              v = temp[0];
              if(v)
              rows[r].push(v.replaceAll('"',''));
              j = headers.length-1;
              r++;
              rows[r] = [];
            }
            if(c)
            rows[r].push(c.replaceAll('"',''));
            j--;
          }
          //remove empty
          rows.shift();
          rows.pop();
          //replace in header
          for(i = 0;i<headers.length;i++){
            headers[i] = headers[i].replaceAll('"','');
          }
          //replace in info
          for(i = 0;i<info.length;i++){
            info[i] = info[i].replaceAll('"','');
          }
          for(i=0;i<headers.length;i++){
            tmp = headers[i] + " " + info[i];
            $scope.headerData.push({name:tmp,type:null});
          }
          //
          for(i=0;i<rows.length;i++){
            for(j=0;j<rows[i].length;j++){
              $scope.determineCellType(rows[i][j],j);
            }
            $scope.bodyData.push(rows[i]);
          }

          //loader
          $scope.buildFilter();
        });
      };

      $scope.showResult = false;
      $scope.showMax = 100;
      $scope.message = null;
      $scope.alerts = [];
      $scope.createEmptyFilter()
      $scope.loadSavedFilters();

    }]);

var $ = require('jquery');
var Backbone = require('backbone');
var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');
var UserModel = require('../../../../../javascripts/cartodb3/data/user-model');
var ExportImagePane = require('../../../../../javascripts/cartodb3/editor/export-image-pane/export-image-pane');
var ExportImageFormModel = require('../../../../../javascripts/cartodb3/editor/export-image-pane/export-image-form-model');

var Notifier = require('../../../../../javascripts/cartodb3/components/notifier/notifier');
var EditorModel = require('../../../../../javascripts/cartodb3/data/editor-model');

describe('editor/export-image-pane/export-image-pane', function () {
  beforeEach(function () {
    this._mapView = new Backbone.View();

    this._mapView.containerPointToLatLng = function (x, y) {
      return { lat: 123, lng: 456 };
    };

    this._mapView.latLngToContainerPoint = function () {
      return { x: 100, y: 20 };
    };

    window.mapView = this._mapView;

    this._vis = new Backbone.View();

    var style = '[{ "stylers": [ { "saturation": -100 } ] },{ "featureType": "water", "stylers": [ { "gamma": 1.67 }, { "lightness": 27 } ] },{ "elementType": "geometry", "stylers": [ { "gamma": 1.31 }, { "lightness": 12 } ] },{ "featureType": "administrative", "elementType": "labels", "stylers": [ { "lightness": 51 }, { "gamma": 0.94 } ] },{ },{ "featureType": "road", "elementType": "labels", "stylers": [ { "lightness": 57 } ] },{ "featureType": "poi", "elementType": "labels", "stylers": [ { "lightness": 42 } ] }]';

    this._vis.getLayers = function () {
      return [ new Backbone.Model({ style: style }) ];
    };

    this._vis.map = new Backbone.Model();
    this._vis.map.getZoom = function () { return 10; };
    this._vis.map.getBaseLayer = function () { return new Backbone.Model({ baseType: 'roadmap' }); };

    this._vis.getStaticImageURL = function () { };
    window.vis = this._vis;

    spyOn(this._vis, 'getStaticImageURL').and.callThrough();

    this._exportImageFormModel = new ExportImageFormModel({
      userModel: new Backbone.Model(),
      hasGoogleBasemap: false,
      format: '.png',
      x: 10,
      y: 100,
      width: 300,
      height: 200
    });

    Notifier.init({
      editorModel: new EditorModel(),
      visDefinitionModel: new Backbone.Model()
    });

    this._configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this._userModel = new UserModel({
      username: 'perico',
      google_maps_key: 123456
    }, {
      configModel: this._configModel
    });

    this.view = new ExportImagePane({
      canvasClassName: 'CDB-Map',
      configModel: this._configModel,
      userModel: this._userModel,
      stackLayoutModel: new Backbone.Collection(),
      editorModel: new Backbone.Model(),
      visDefinitionModel: new Backbone.Model()
    });

    // mocks
    this.view._loadLogo = function () { return true; };
    this.view._loadAttribution = function () { return true; };

    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$el.length).toBe(1);
  });

  it('should call the method to generate the image', function () {
    this.view.$('.js-ok').click();

    expect(this._vis.getStaticImageURL).toHaveBeenCalledWith({
      zoom: 10,
      width: 300,
      height: 200,
      lat: 123,
      lng: 456,
      format: 'png'
    });
  });

  describe('with google maps', function () {
    beforeEach(function () {
      this._exportImageFormModel = new ExportImageFormModel({
        userModel: new Backbone.Model(),
        hasGoogleBasemap: true,
        format: '.png',
        x: 10,
        y: 100,
        width: 300,
        height: 200
      });

      this._vis.map.set('provider', 'googlemaps');

      this.view = new ExportImagePane({
        canvasClassName: 'CDB-Map',
        configModel: this._configModel,
        userModel: this._userModel,
        stackLayoutModel: new Backbone.Collection(),
        editorModel: new Backbone.Model(),
        visDefinitionModel: new Backbone.Model()
      });

      // mocks
      this.view._loadLogo = function () { return true; };
      this.view._loadAttribution = function () { return true; };

      this.view.render();
    });

    it('should generate the gmaps url', function () {
      expect(this.view._getGMapBasemapURL()).toMatch('https:\/\/maps.googleapis.com/maps/api/staticmap\?center=123,456&zoom=10&size=300x200&mapType=roadmap&rnd=.*?&style=feature:all\|element:all\|saturation:-100\|&style=feature:water\|element:all\|gamma:1.67\|lightness:27\|&style=feature:all\|element:geometry\|gamma:1.31\|lightness:12\|&style=feature:administrative\|element:labels\|lightness:51\|gamma:0.94\|&style=feature:road\|element:labels\|lightness:57\|&style=feature:poi\|element:labels\|lightness:42\|&key=123456');
    });

    it('should call the google method to generate the image', function () {
      spyOn(this.view, '_getGMapBasemapURL').and.callThrough();

      this.view.$('.js-ok').click();
      expect(this.view._getGMapBasemapURL).toHaveBeenCalled();
    });
  });

  describe('with errors', function () {
    beforeEach(function () {
      this._exportImageFormModel = new ExportImageFormModel({
        userModel: new Backbone.Model(),
        hasGoogleBasemap: true,
        format: '.png',
        x: 10,
        y: 100,
        width: 300,
        height: 200
      });

      this._vis.map.set('provider', 'googlemaps');

      this.view = new ExportImagePane({
        canvasClassName: 'CDB-Map',
        configModel: this._configModel,
        userModel: this._userModel,
        stackLayoutModel: new Backbone.Collection(),
        editorModel: new Backbone.Model(),
        visDefinitionModel: new Backbone.Model()
      });

      // mocks
      this.view._loadLogo = function () {
        var deferred = $.Deferred();
        deferred.reject(_t('editor.maps.export-image.errors.error-attribution'));
        return deferred.promise();
      };

      this.view.render();
    });

    it('should show notification', function () {
      var notifications = Notifier.getCollection().length;
      this.view.$('.js-ok').click();
      expect(Notifier.getCollection().length).toBe(notifications + 1);
    });
  });

  afterEach(function () {
    this.view.remove();
  });
});

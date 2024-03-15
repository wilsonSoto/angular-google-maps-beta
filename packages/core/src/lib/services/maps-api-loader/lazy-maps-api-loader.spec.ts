import { LOCALE_ID } from '@angular/core';
import { inject, TestBed } from '@angular/core/testing';
import { DocumentRef, WindowRef } from '../../utils/browser-globals';
import { GoogleMapsScriptProtocol, LazyMapsAPILoader, LazyMapsAPILoaderConfigLiteral, LAZY_MAPS_API_CONFIG } from './lazy-maps-api-loader';
import { MapsAPILoader } from './maps-api-loader';

describe('Service: LazyMapsAPILoader', () => {
  let documentRef: DocumentRef;
  let doc: any;
  let windowRef: WindowRef;
  let windowObj: any;

  beforeEach(() => {
    doc = {
      createElement: jest.fn(),
      getElementById: jest.fn().mockReturnValue(null),
      body: {
        appendChild: jest.fn(),
      },
    };
    documentRef = {
      getNativeDocument: jest.fn().mockReturnValue(doc),
    } as DocumentRef;

    windowObj = {};
    windowRef = {
      getNativeWindow: jest.fn().mockReturnValue(windowObj),
    } as WindowRef;
    TestBed.configureTestingModule({
      providers: [
        {provide: MapsAPILoader, useClass: LazyMapsAPILoader},
        {provide: WindowRef, useValue: windowRef},
        {provide: DocumentRef, useValue: documentRef},
        {provide: LOCALE_ID, useValue: 'en-US'},
      ],
    });
  });

  it('should create the default script URL', inject([MapsAPILoader], (loader: LazyMapsAPILoader) => {
      interface Script {
        src?: string;
        async?: boolean;
        defer?: boolean;
        type?: string;
        id?: string;
      }
      const scriptElem: Script = {};
      (doc.createElement as jest.Mock).mockReturnValue(scriptElem);

      loader.load();
      expect(doc.createElement).toHaveBeenCalledWith('script');
      expect(scriptElem.type).toEqual('text/javascript');
      expect(scriptElem.async).toEqual(true);
      expect(scriptElem.defer).toEqual(true);
      expect(scriptElem.src).toBeDefined();
      expect(scriptElem.id).toEqual('agmGoogleMapsApiScript');
      expect(scriptElem.src).toContain('https://maps.googleapis.com/maps/api/js');
      expect(scriptElem.src).toContain('v=quarterly');
      expect(scriptElem.src).toContain('callback=agmLazyMapsAPILoader');
      expect(doc.body.appendChild).toHaveBeenCalledWith(scriptElem);
  }));

  it('should not append a second script to body when theres already one with the fixed ID', inject([MapsAPILoader], (loader: LazyMapsAPILoader) => {
      (doc.getElementById as jest.Mock).mockReturnValue(document.createElement('script'));
      loader.load();
      expect(doc.body.appendChild).not.toHaveBeenCalledWith();
  }));

  it('should not append a second script to body when window.google.maps is defined', inject([MapsAPILoader], (loader: LazyMapsAPILoader) => {
    windowObj.google = {
      maps: {},
    };
    loader.load();
    expect(doc.body.appendChild).not.toHaveBeenCalledWith();
  }));

  it('should load the script via http when provided', () => {
    const lazyLoadingConf:
        LazyMapsAPILoaderConfigLiteral = {protocol: GoogleMapsScriptProtocol.HTTP};

    TestBed.configureTestingModule({
      providers: [
        {provide: MapsAPILoader, useClass: LazyMapsAPILoader},
        {provide: WindowRef, useValue: windowRef},
        {provide: DocumentRef, useValue: documentRef},
        {provide: LOCALE_ID, useValue: 'en-US'},
        {provide: LAZY_MAPS_API_CONFIG, useValue: lazyLoadingConf},
      ],
    });

    const loader = TestBed.inject(MapsAPILoader);

    interface Script {
      src?: string;
      async?: boolean;
      defer?: boolean;
      type?: string;
    }
    const scriptElem: Script = {};
    (doc.createElement as jest.Mock).mockReturnValue(scriptElem);

    loader.load();
    expect(doc.createElement).toHaveBeenCalled();
    expect(scriptElem.src).toContain('http://maps.googleapis.com/maps/api/js');
    expect(doc.body.appendChild).toHaveBeenCalledWith(scriptElem);
  });

  it('should load language based on locale', () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: MapsAPILoader, useClass: LazyMapsAPILoader},
        {provide: WindowRef, useValue: windowRef},
        {provide: DocumentRef, useValue: documentRef},
        {provide: LOCALE_ID, useValue: 'es'},
      ],
    });

    const loader = TestBed.inject(MapsAPILoader);
    interface Script {
      src?: string;
      async?: boolean;
      defer?: boolean;
      type?: string;
    }
    const scriptElem: Script = {};
    (doc.createElement as jest.Mock).mockReturnValue(scriptElem);

    loader.load();
    expect(doc.createElement).toHaveBeenCalled();
    const url = new URL(scriptElem.src);
    expect(url.searchParams.get('language')).toEqual('es');
  });

  it('should load language based on config', () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: MapsAPILoader, useClass: LazyMapsAPILoader},
        {provide: WindowRef, useValue: windowRef},
        {provide: DocumentRef, useValue: documentRef},
        {provide: LAZY_MAPS_API_CONFIG, useValue: {language: 'tr'} as LazyMapsAPILoaderConfigLiteral},
        {provide: LOCALE_ID, useValue: 'es'},
      ],
    });

    const loader = TestBed.inject(MapsAPILoader);
    interface Script {
      src?: string;
      async?: boolean;
      defer?: boolean;
      type?: string;
    }
    const scriptElem: Script = {};
    (doc.createElement as jest.Mock).mockReturnValue(scriptElem);

    loader.load();
    expect(doc.createElement).toHaveBeenCalled();
    const url = new URL(scriptElem.src);
    expect(url.searchParams.get('language')).toEqual('tr');
  });
});

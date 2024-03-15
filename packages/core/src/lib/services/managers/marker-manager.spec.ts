import { NgZone } from '@angular/core';
import { fakeAsync, flushMicrotasks, inject, TestBed, tick } from '@angular/core/testing';

import { AgmMarker } from './../../directives/marker';
import { GoogleMapsAPIWrapper } from './../google-maps-api-wrapper';
import { MarkerManager } from './../managers/marker-manager';

describe('MarkerManager', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {provide: NgZone, useFactory: () => new NgZone({enableLongStackTrace: true})},
        MarkerManager, {
          provide: GoogleMapsAPIWrapper,
          useValue: {
            createMarker: jest.fn().mockReturnValue(Promise.resolve()),
            getNativeMap: jest.fn().mockReturnValue(Promise.resolve()),
          },
        },
      ],
    });
  });

  describe('Create a new marker', () => {
    it('should call the mapsApiWrapper when creating a new marker',
      fakeAsync(inject(
           [MarkerManager, GoogleMapsAPIWrapper],
           (markerManager: MarkerManager, apiWrapper: GoogleMapsAPIWrapper) => {
             const newMarker = new AgmMarker(markerManager);
             newMarker.latitude = 34.4;
             newMarker.longitude = 22.3;
             newMarker.label = 'A';
             markerManager.addMarker(newMarker);
              flushMicrotasks();
              expect(apiWrapper.createMarker).toHaveBeenCalledWith({
               position: {lat: 34.4, lng: 22.3},
               label: 'A',
               draggable: false,
               icon: undefined,
               opacity: 1,
               visible: true,
               zIndex: 1,
               title: undefined,
               clickable: true,
               animation: undefined,
             });
          })));
  });

  describe('Delete a marker', () => {
    it('should set the map to null when deleting a existing marker',
       fakeAsync(inject(
           [MarkerManager, GoogleMapsAPIWrapper],
           (markerManager: MarkerManager, apiWrapper: GoogleMapsAPIWrapper) => {
             const newMarker = new AgmMarker(markerManager);
             newMarker.latitude = 34.4;
             newMarker.longitude = 22.3;
             newMarker.label = 'A';

             const markerInstance: any = {
              setMap: jest.fn(),
             };
             (apiWrapper.createMarker as jest.Mock).mockReturnValue(Promise.resolve(markerInstance));

             markerManager.addMarker(newMarker);
             markerManager.deleteMarker(newMarker).then(
                 () => { expect(markerInstance.setMap).toHaveBeenCalledWith(null); });
           })));
  });

  describe('set marker icon', () => {
    it('should update that marker via setIcon method when the markerUrl changes',
       fakeAsync(inject(
           [MarkerManager, GoogleMapsAPIWrapper],
           (markerManager: MarkerManager, apiWrapper: GoogleMapsAPIWrapper) => {
             const newMarker = new AgmMarker(markerManager);
             newMarker.latitude = 34.4;
             newMarker.longitude = 22.3;
             newMarker.label = 'A';

             const markerInstance: any = {
              setMap: jest.fn(),
              setIcon: jest.fn(),
             };
             (apiWrapper.createMarker as jest.Mock).mockReturnValue(Promise.resolve(markerInstance));

             markerManager.addMarker(newMarker);
             flushMicrotasks();
             expect(apiWrapper.createMarker).toHaveBeenCalledWith({
               position: {lat: 34.4, lng: 22.3},
               label: 'A',
               draggable: false,
               icon: undefined,
               opacity: 1,
               visible: true,
               zIndex: 1,
               title: undefined,
               clickable: true,
               animation: undefined,
             });
             const iconUrl = 'http://angular-maps.com/icon.png';
             newMarker.iconUrl = iconUrl;
             return markerManager.updateIcon(newMarker).then(
                 () => { expect(markerInstance.setIcon).toHaveBeenCalledWith(iconUrl); });
           })));
  });

  describe('set marker opacity', () => {
    it('should update that marker via setOpacity method when the markerOpacity changes',
       fakeAsync(inject(
           [MarkerManager, GoogleMapsAPIWrapper],
           (markerManager: MarkerManager, apiWrapper: GoogleMapsAPIWrapper) => {
             const newMarker = new AgmMarker(markerManager);
             newMarker.latitude = 34.4;
             newMarker.longitude = 22.3;
             newMarker.label = 'A';

             const markerInstance: any = {
              setMap: jest.fn(),
              setOpacity: jest.fn(),
             };
             (apiWrapper.createMarker as jest.Mock).mockReturnValue(Promise.resolve(markerInstance));

             markerManager.addMarker(newMarker);
             flushMicrotasks();
             expect(apiWrapper.createMarker).toHaveBeenCalledWith({
               position: {lat: 34.4, lng: 22.3},
               label: 'A',
               draggable: false,
               icon: undefined,
               visible: true,
               opacity: 1,
               zIndex: 1,
               title: undefined,
               clickable: true,
               animation: undefined,
             });
             const opacity = 0.4;
             newMarker.opacity = opacity;
             return markerManager.updateOpacity(newMarker).then(
                 () => { expect(markerInstance.setOpacity).toHaveBeenCalledWith(opacity); });
           })));
  });

  describe('set visible option', () => {
    it('should update that marker via setVisible method when the visible changes',
      fakeAsync(inject(
           [MarkerManager, GoogleMapsAPIWrapper],
           (markerManager: MarkerManager, apiWrapper: GoogleMapsAPIWrapper) => {
             const newMarker = new AgmMarker(markerManager);
             newMarker.latitude = 34.4;
             newMarker.longitude = 22.3;
             newMarker.label = 'A';
             newMarker.visible = false;

             const markerInstance: any = {
              setMap: jest.fn(),
              setVisible: jest.fn(),
             };
             (apiWrapper.createMarker as jest.Mock).mockReturnValue(Promise.resolve(markerInstance));

             markerManager.addMarker(newMarker);
             flushMicrotasks();
             expect(apiWrapper.createMarker).toHaveBeenCalledWith({
               position: {lat: 34.4, lng: 22.3},
               label: 'A',
               draggable: false,
               icon: undefined,
               visible: false,
               opacity: 1,
               zIndex: 1,
               title: undefined,
               clickable: true,
               animation: undefined,
             });
             newMarker.visible = true;
             return markerManager.updateVisible(newMarker).then(
                 () => { expect(markerInstance.setVisible).toHaveBeenCalledWith(true); });
           })));
  });

  describe('set zIndex option', () => {
    it('should update that marker via setZIndex method when the zIndex changes',
      fakeAsync(inject(
           [MarkerManager, GoogleMapsAPIWrapper],
           (markerManager: MarkerManager, apiWrapper: GoogleMapsAPIWrapper) => {
             const newMarker = new AgmMarker(markerManager);
             newMarker.latitude = 34.4;
             newMarker.longitude = 22.3;
             newMarker.label = 'A';
             newMarker.visible = false;

             const markerInstance: any = {
              setMap: jest.fn(),
              setZIndex: jest.fn(),
             };
             (apiWrapper.createMarker as jest.Mock).mockReturnValue(Promise.resolve(markerInstance));

             markerManager.addMarker(newMarker);
             flushMicrotasks();
             expect(apiWrapper.createMarker).toHaveBeenCalledWith({
               position: {lat: 34.4, lng: 22.3},
               label: 'A',
               draggable: false,
               icon: undefined,
               visible: false,
               opacity: 1,
               zIndex: 1,
               title: undefined,
               clickable: true,
               animation: undefined,
             });
             const zIndex = 10;
             newMarker.zIndex = zIndex;
             return markerManager.updateZIndex(newMarker).then(
                 () => { expect(markerInstance.setZIndex).toHaveBeenCalledWith(zIndex); });
           })));
  });

  describe('set animation option', () => {
    it('should update that marker via setAnimation method when the animation changes',
      fakeAsync(inject(
           [MarkerManager, GoogleMapsAPIWrapper],
           (markerManager: MarkerManager, apiWrapper: GoogleMapsAPIWrapper) => {
             const newMarker = new AgmMarker(markerManager);
             newMarker.latitude = 34.4;
             newMarker.longitude = 22.3;
             newMarker.label = 'A';
             newMarker.visible = false;
             newMarker.animation = null;

             const markerInstance: any = {
              setMap: jest.fn(),
              setAnimation: jest.fn().mockReturnValue(new Promise(resolve => setTimeout(resolve, 500))),
             };
             (apiWrapper.createMarker as jest.Mock).mockReturnValue(Promise.resolve(markerInstance));

             markerManager.addMarker(newMarker);
             flushMicrotasks();
             expect(apiWrapper.createMarker).toHaveBeenCalledWith({
               position: {lat: 34.4, lng: 22.3},
               label: 'A',
               draggable: false,
               icon: undefined,
               visible: false,
               opacity: 1,
               zIndex: 1,
               title: undefined,
               clickable: true,
               animation: null,
             });
             const animation = 'BOUNCE';
             newMarker.animation = animation;
             const updatePromise = markerManager.updateAnimation(newMarker);
             tick(600);
             updatePromise.then(
                 () => expect(markerInstance.setAnimation).toHaveBeenCalledWith(1));
           })));
  });
});

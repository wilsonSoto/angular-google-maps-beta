import { AfterContentInit, ContentChildren, Directive, EventEmitter, Input, OnChanges, OnDestroy, Output, QueryList, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';

import { PolylineManager } from '../services/managers/polyline-manager';
import { MVCEvent } from '../utils/mvcarray-utils';
import { AgmPolylineIcon } from './polyline-icon';
import { AgmPolylinePoint } from './polyline-point';

let polylineId = 0;
/**
 * AgmPolyline renders a polyline on a {@link AgmMap}
 *
 * ### Example
 * ```typescript
 * import { Component } from '@angular/core';
 *
 * @Component({
 *  selector: 'my-map-cmp',
 *  styles: [`
 *    .agm-map-container {
 *      height: 300px;
 *    }
 * `],
 *  template: `
 *    <agm-map [latitude]="lat" [longitude]="lng" [zoom]="zoom">
 *      <agm-polyline>
 *          <agm-polyline-point [latitude]="latA" [longitude]="lngA">
 *          </agm-polyline-point>
 *          <agm-polyline-point [latitude]="latB" [longitude]="lngB">
 *          </agm-polyline-point>
 *      </agm-polyline>
 *    </agm-map>
 *  `
 * })
 * ```
 */
@Directive({
  selector: 'agm-polyline',
})
export class AgmPolyline implements OnDestroy, OnChanges, AfterContentInit {
  /**
   * Indicates whether this Polyline handles mouse events. Defaults to true.
   */
  @Input() clickable = true;

  /**
   * If set to true, the user can drag this shape over the map. The geodesic property defines the
   * mode of dragging. Defaults to false.
   */
  // tslint:disable-next-line:no-input-rename
  @Input('polylineDraggable') draggable = false;

  /**
   * If set to true, the user can edit this shape by dragging the control points shown at the
   * vertices and on each segment. Defaults to false.
   */
  @Input() editable = false;

  /**
   * When true, edges of the polygon are interpreted as geodesic and will follow the curvature of
   * the Earth. When false, edges of the polygon are rendered as straight lines in screen space.
   * Note that the shape of a geodesic polygon may appear to change when dragged, as the dimensions
   * are maintained relative to the surface of the earth. Defaults to false.
   */
  @Input() geodesic = false;

  /**
   * The stroke color. All CSS3 colors are supported except for extended named colors.
   */
  @Input() strokeColor: string;

  /**
   * The stroke opacity between 0.0 and 1.0.
   */
  @Input() strokeOpacity: number;

  /**
   * The stroke width in pixels.
   */
  @Input() strokeWeight: number;

  /**
   * Whether this polyline is visible on the map. Defaults to true.
   */
  @Input() visible = true;

  /**
   * The zIndex compared to other polys.
   */
  @Input() zIndex: number;

  /**
   * This event is fired when the DOM click event is fired on the Polyline.
   */
  @Output() lineClick: EventEmitter<google.maps.PolyMouseEvent> = new EventEmitter<google.maps.PolyMouseEvent>();

  /**
   * This event is fired when the DOM dblclick event is fired on the Polyline.
   */
  @Output() lineDblClick: EventEmitter<google.maps.PolyMouseEvent> = new EventEmitter<google.maps.PolyMouseEvent>();

  /**
   * This event is repeatedly fired while the user drags the polyline.
   */
  @Output() lineDrag: EventEmitter<google.maps.MouseEvent> = new EventEmitter<google.maps.MouseEvent>();

  /**
   * This event is fired when the user stops dragging the polyline.
   */
  @Output() lineDragEnd: EventEmitter<google.maps.MouseEvent> = new EventEmitter<google.maps.MouseEvent>();

  /**
   * This event is fired when the user starts dragging the polyline.
   */
  @Output() lineDragStart: EventEmitter<google.maps.MouseEvent> = new EventEmitter<google.maps.MouseEvent>();

  /**
   * This event is fired when the DOM mousedown event is fired on the Polyline.
   */
  @Output() lineMouseDown: EventEmitter<google.maps.PolyMouseEvent> = new EventEmitter<google.maps.PolyMouseEvent>();

  /**
   * This event is fired when the DOM mousemove event is fired on the Polyline.
   */
  @Output() lineMouseMove: EventEmitter<google.maps.PolyMouseEvent> = new EventEmitter<google.maps.PolyMouseEvent>();

  /**
   * This event is fired on Polyline mouseout.
   */
  @Output() lineMouseOut: EventEmitter<google.maps.PolyMouseEvent> = new EventEmitter<google.maps.PolyMouseEvent>();

  /**
   * This event is fired on Polyline mouseover.
   */
  @Output() lineMouseOver: EventEmitter<google.maps.PolyMouseEvent> = new EventEmitter<google.maps.PolyMouseEvent>();

  /**
   * This event is fired whe the DOM mouseup event is fired on the Polyline
   */
  @Output() lineMouseUp: EventEmitter<google.maps.PolyMouseEvent> = new EventEmitter<google.maps.PolyMouseEvent>();

  /**
   * This event is fired when the Polyline is right-clicked on.
   */
  @Output() lineRightClick: EventEmitter<google.maps.PolyMouseEvent> = new EventEmitter<google.maps.PolyMouseEvent>();

  /**
   * This event is fired after Polyline's path changes.
   */
  @Output() polyPathChange = new EventEmitter<MVCEvent<google.maps.LatLng>>();

  /**
   * @internal
   */
  @ContentChildren(AgmPolylinePoint) points: QueryList<AgmPolylinePoint>;

  @ContentChildren(AgmPolylineIcon) iconSequences: QueryList<AgmPolylineIcon>;

  private static _polylineOptionsAttributes: string[] = [
    'draggable', 'editable', 'visible', 'geodesic', 'strokeColor', 'strokeOpacity', 'strokeWeight',
    'zIndex',
  ];

  private _id: string;
  private _polylineAddedToManager = false;
  private _subscriptions: Subscription[] = [];

  constructor(private _polylineManager: PolylineManager) { this._id = (polylineId++).toString(); }

  /** @internal */
  ngAfterContentInit() {
    if (this.points.length) {
      this.points.forEach((point: AgmPolylinePoint) => {
        const s = point.positionChanged.subscribe(
            () => { this._polylineManager.updatePolylinePoints(this); });
        this._subscriptions.push(s);
      });
    }
    if (!this._polylineAddedToManager) {
      this._init();
    }
    const pointSub = this.points.changes.subscribe(() => this._polylineManager.updatePolylinePoints(this));
    this._subscriptions.push(pointSub);
    this._polylineManager.updatePolylinePoints(this);

    const iconSub = this.iconSequences.changes.subscribe(() => this._polylineManager.updateIconSequences(this));
    this._subscriptions.push(iconSub);
  }

  ngOnChanges(changes: SimpleChanges): any {
    if (!this._polylineAddedToManager) {
      this._init();
      return;
    }

    const options: {[propName: string]: any} = {};
    const optionKeys = Object.keys(changes).filter(
        k => AgmPolyline._polylineOptionsAttributes.indexOf(k) !== -1);
    optionKeys.forEach(k => options[k] = changes[k].currentValue);
    this._polylineManager.setPolylineOptions(this, options);
  }

  getPath(): Promise<google.maps.LatLng[]> {
    return this._polylineManager.getPath(this);
  }

  private _init() {
    this._polylineManager.addPolyline(this);
    this._polylineAddedToManager = true;
    this._addEventListeners();
  }

  private _addEventListeners() {
    const handlers = [
      {name: 'click', handler: (ev: google.maps.PolyMouseEvent) => this.lineClick.emit(ev)},
      {name: 'dblclick', handler: (ev: google.maps.PolyMouseEvent) => this.lineDblClick.emit(ev)},
      {name: 'drag', handler: (ev: google.maps.MouseEvent) => this.lineDrag.emit(ev)},
      {name: 'dragend', handler: (ev: google.maps.MouseEvent) => this.lineDragEnd.emit(ev)},
      {name: 'dragstart', handler: (ev: google.maps.MouseEvent) => this.lineDragStart.emit(ev)},
      {name: 'mousedown', handler: (ev: google.maps.PolyMouseEvent) => this.lineMouseDown.emit(ev)},
      {name: 'mousemove', handler: (ev: google.maps.PolyMouseEvent) => this.lineMouseMove.emit(ev)},
      {name: 'mouseout', handler: (ev: google.maps.PolyMouseEvent) => this.lineMouseOut.emit(ev)},
      {name: 'mouseover', handler: (ev: google.maps.PolyMouseEvent) => this.lineMouseOver.emit(ev)},
      {name: 'mouseup', handler: (ev: google.maps.PolyMouseEvent) => this.lineMouseUp.emit(ev)},
      {name: 'rightclick', handler: (ev: google.maps.PolyMouseEvent) => this.lineRightClick.emit(ev)},
    ];
    handlers.forEach((obj) => {
      const os = this._polylineManager.createEventObservable(obj.name, this).subscribe(obj.handler);
      this._subscriptions.push(os);
    });

    this._polylineManager.createPathEventObservable(this).then((ob$) => {
      const os = ob$.subscribe(pathEvent => this.polyPathChange.emit(pathEvent));
      this._subscriptions.push(os);
    });
  }

  /** @internal */
  _getPoints(): AgmPolylinePoint[] {
    if (this.points) {
      return this.points.toArray();
    }
    return [];
  }

  _getIcons(): Array<AgmPolylineIcon> {
    if (this.iconSequences) {
      return this.iconSequences.toArray();
    }
    return [];
  }

  /** @internal */
  id(): string { return this._id; }

  /** @internal */
  ngOnDestroy() {
    this._polylineManager.deletePolyline(this);
    // unsubscribe all registered observable subscriptions
    this._subscriptions.forEach((s) => s.unsubscribe());
  }
}

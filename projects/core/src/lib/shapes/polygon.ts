import { view } from '../view';
import { data } from '../data';

import { ObjectId } from '../id';
import { Point, POINT } from '../utilities/point';
import { Position, POSITION, POSITION_DEFAULTS } from '../utilities/position';

export class Polygon {
    
    readonly type = 'polygon';

    public id:          string      = ObjectId();
    public data:        any         = {};
    public name:        string      = '';
    public points:      Point[]     = [];
    public states:      any[]       = [];
    public hidden:      boolean     = false;
    public lineCap:     string      = 'round';
    public position:    POSITION    = new Position(POSITION_DEFAULTS);
    public selected:    boolean     = false;
    public dragging:    boolean     = false;
    public lineWidth:   number      = 1;
    public fillColor:   string      = 'rgba(0, 0, 0, 0.5)';
    public strokeColor: string      = 'rgba(0, 0, 0, 1)';
    
    constructor(polygon?: POLYGON, skip?: boolean) {
        this.set(polygon);
      
        if (!skip) {
            data.push(this);
        };

        this.bounds();
    };

    public bounds() {
        let minX = 10000000;
        let maxX = 0;
        let minY = 10000000;
        let maxY = 0;

        this.points.map(point => {
            if (point.x < minX) {
                minX = point.x;
            };
            if (point.x > maxX) {
                maxX = point.x;
            };
            if (point.y < minY) {
                minY = point.y;
            };
            if (point.y > maxY) {
                maxY = point.y;
            };
        });
        this.position.x         = minX;
        this.position.y         = minY;
        this.position.top       = minY;
        this.position.left      = minX;
        this.position.right     = maxX;
        this.position.width     = maxX - minX;
        this.position.height    = maxY - minY;
        this.position.bottom    = maxY;
        this.position.center    = new Point({
            'x': this.position.x + (this.position.width / 2),
            'y': this.position.y + (this.position.height / 2)
        });
    };

    public move(point: POINT) {
        let difference = {
            'x': this.position.center.x - point.x,
            'y': this.position.center.y - point.y
        };
        this.points.map(pt => {
            pt.x = pt.x - difference.x;
            pt.y = pt.y - difference.y;
        });
        this.bounds();
    };

    public set(polygon: POLYGON) {
        if (typeof(polygon) != 'undefined') {
            if (typeof(polygon.data) != "undefined") {
                this.data = polygon.data;
            };
            if (typeof(polygon.name) == "string") {
                this.name = polygon.name;
            };
            if (Array.isArray(polygon.states)) {
                this.states = polygon.states;
            };
            if (Array.isArray(polygon.points)) {
                this.points = polygon.points;
            };
            if (typeof(polygon.hidden) != "undefined") {
                this.hidden = polygon.hidden;
            };
            if (typeof(polygon.position) != "undefined") {
                this.position = new Position(polygon.position);
            };
            if (typeof(polygon.lineWidth) == "number") {
                this.lineWidth = polygon.lineWidth;
            };
            if (typeof(polygon.fillColor) != "undefined") {
                this.fillColor = polygon.fillColor;
            };
            if (typeof(polygon.strokeColor) != "undefined") {
                this.strokeColor = polygon.strokeColor;
            };
        };
    };

    public hit(point: POINT, radius?: number) {
        view.context.beginPath();
        
        view.context.fillStyle      = this.fillColor;
        view.context.lineWidth      = this.lineWidth;
        view.context.strokeStyle    = this.strokeColor;
        
        if (Array.isArray(this.points)) {
            let index = 0;
            this.points.map(point => {
                if (index == 0) {
                    view.context.moveTo(point.x, point.y);
                } else {
                    view.context.lineTo(point.x, point.y);
                };
                index++;
            });
        };

        view.context.fill();
        view.context.stroke();
        
        view.context.closePath();
        
        let hit = view.context.isPointInPath(point.x, point.y);

        return hit;
    };

    public near(point: POINT, radius?: number) {
        if (typeof(radius) == "undefined") {
            radius = 0;
        };
        for (let i = 0; i < this.points.length; i++) {
            if (this.points[i].x - radius <= point.x && this.points[i].x + radius >= point.x && this.points[i].y - radius <= point.y && this.points[i].y + radius >= point.y) {
                return new Point({
                    'x': this.points[i].x,
                    'y': this.points[i].y
                });
            };
        };
        return false;
    };

    public resize(point: POINT, current: POINT) {
        for (let i = 0; i < this.points.length; i++) {
            if (this.points[i].x == point.x && this.points[i].y == point.y) {
                if ((i == 0 || i == this.points.length - 1) && this.points.length > 1) {
                    if (this.points[0].x == this.points[this.points.length - 1].x && this.points[0].y == this.points[this.points.length - 1].y) {
                        this.points[0].x                        = current.x;
                        this.points[0].y                        = current.y;
                        this.points[this.points.length - 1].x   = current.x;
                        this.points[this.points.length - 1].y   = current.y;
                        break;
                    };
                };
                this.points[i].x = current.x;
                this.points[i].y = current.y;
                break;
            };
        };
        if (this.position.width < 0) {
            this.position.width = 0;
        };
        if (this.position.height < 0) {
            this.position.height = 0;
        };
        this.bounds();
    };

}

export interface POLYGON {
    'id'?:          string;
    'data'?:        any;
    'name'?:        string;
    'states'?:      any[];
    'hidden'?:      boolean;
    'points':       POINT[];
    'lineCap'?:     string;
    'position'?:    POSITION;
    'selected'?:    boolean;
    'dragging'?:    boolean;
    'lineWidth'?:   number;
    'fillColor'?:   string;
    'strokeColor'?: string;
}
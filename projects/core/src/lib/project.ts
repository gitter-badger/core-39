import { view } from './view';
import { data } from './data';

import { Select } from './utilities/select';
import { ObjectId } from './id';
import { Point, POINT } from './utilities/point';
import { Position, POSITION } from './utilities/position';

import { Subject, BehaviorSubject } from 'rxjs';

/* --- SHAPES --- */
import { Arc, ARC } from './shapes/arc';
import { Line, LINE } from './shapes/line';
import { Text, TEXT } from './shapes/text';
import { Chart, CHART } from './shapes/chart';
import { Group, GROUP } from './shapes/group';
import { Circle, CIRCLE } from './shapes/circle';
import { Button, BUTTON } from './shapes/button';
import { Vector, VECTOR } from './shapes/vector';
import { Polygon, POLYGON } from './shapes/polygon';
import { Rectangle, RECTANGLE } from './shapes/rectangle';

export class Project {

    public click: Subject<POINT> = new Subject<POINT>();
    public mouseup: Subject<POINT> = new Subject<POINT>();
    public mousemove: Subject<POINT> = new Subject<POINT>();
    public mousedown: Subject<POINT> = new Subject<POINT>();

    public moving: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    public holding: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    public grid: any = {
        'snap': false,
        'enabled': false,
        'spacing': 10,
        'lineWidth': 1,
        'strokeColor': 'rgba(0, 0, 0, 1)'
    };
    public width: number = 600;
    public height: number = 600;
    public editing: boolean;
    public fillColor: string = 'rgba(0, 0, 0, 0)';

    constructor(canvasId: string) {
        view.canvas = document.getElementById(canvasId);
        view.context = view.canvas.getContext('2d');

        view.canvas.addEventListener('mouseup', (event) => {
            this.moving.next(false);
            this.holding.next(false);
            this.mouseup.next({
                'x': event.clientX - view.canvas.getBoundingClientRect().x,
                'y': event.clientY - view.canvas.getBoundingClientRect().y
            });
        });
        view.canvas.addEventListener('mousemove', (event) => {
            this.moving.next(true);
            this.mousemove.next({
                'x': event.clientX - view.canvas.getBoundingClientRect().x,
                'y': event.clientY - view.canvas.getBoundingClientRect().y
            });
        });
        view.canvas.addEventListener('mousedown', (event) => {
            this.holding.next(true);
            this.mousedown.next({
                'x': event.clientX - view.canvas.getBoundingClientRect().x,
                'y': event.clientY - view.canvas.getBoundingClientRect().y
            });
        });

        this.draw();
    };

    private draw() {
        view.canvas.width = this.width;
        view.canvas.height = this.height;
        view.canvas.style.background = this.fillColor;

        view.context.clearRect(0, 0, view.canvas.width, view.canvas.height);

        view.context.beginPath();
        view.context.rect(0, 0, view.canvas.width, view.canvas.height);
        view.context.fillStyle = this.fillColor;
        view.context.fill();
        view.context.closePath();

        this.gridify();

        data.map(item => {
            if (item instanceof Arc) {
                this.arc(item);
            };
            if (item instanceof Line) {
                this.line(item);
            };
            if (item instanceof Text) {
                this.text(item);
            };
            if (item instanceof Chart) {
                this.chart(item);
            };
            if (item instanceof Group) {
                this.group(item);
            };
            if (item instanceof Circle) {
                this.circle(item);
            };
            if (item instanceof Button) {
                this.button(item);
            };
            if (item instanceof Vector) {
                this.vector(item);
            };
            if (item instanceof Polygon) {
                this.polygon(item);
            };
            if (item instanceof Rectangle) {
                this.rectangle(item);
            };
            if (item.selected) {
                new Select(item);
            };
        });

        window.requestAnimationFrame(() => this.draw());
    };

    public reset() {
        this.import([]);
    };

    public export() {
        let json = JSON.parse(JSON.stringify(data));
        return json;
    };

    private gridify() {
        if (this.grid.enabled) {
            let maxX = view.canvas.width;
            let maxY = view.canvas.height;

            for (let index = 0; index < maxX; index++) {
                view.context.beginPath();

                view.context.lineWidth = this.grid.lineWidth;
                view.context.strokeStyle = this.grid.strokeColor;

                view.context.moveTo(index * this.grid.spacing, 0);
                view.context.lineTo(index * this.grid.spacing, maxY);

                view.context.stroke();

                view.context.closePath();
            };

            for (let index = 0; index < maxY; index++) {
                view.context.beginPath();

                view.context.lineWidth = this.grid.lineWidth;
                view.context.strokeStyle = this.grid.strokeColor;

                view.context.moveTo(0, index * this.grid.spacing);
                view.context.lineTo(maxX, index * this.grid.spacing);

                view.context.stroke();

                view.context.closePath();
            };
        };
    };

    public deselect() {
        data.map(item => {
            item.selected = false;
        });
    };

    public download() {
        let link = document.createElement("a");
        link.href = view.canvas.toDataURL("image/png")
        link.download = [ObjectId(), 'png'].join('.');
        link.click();
    };

    private arc(item: ARC) {
        view.context.beginPath();

        view.context.lineCap = item.stroke.color;
        view.context.fillStyle = item.fill.color;
        view.context.lineWidth = item.stroke.width;
        view.context.strokeStyle = item.stroke.color;
        
        view.context.arc(item.position.x, item.position.y, item.position.radius, 0, 0.5 * Math.PI);

        if (item.stroke.width > 0) {
            // view.context.fill();
            view.context.stroke();
        };
        
        view.context.closePath();
    };

    private line(item: LINE) {
        view.context.beginPath();

        view.context.lineCap = item.stroke.color;
        view.context.fillStyle = item.fill.color;
        view.context.lineWidth = item.stroke.width;
        view.context.strokeStyle = item.stroke.color;

        if (Array.isArray(item.points)) {
            let index = 0;
            item.points.map(point => {
                if (index == 0) {
                    view.context.moveTo(point.x, point.y);
                } else {
                    view.context.lineTo(point.x, point.y);
                    view.context.moveTo(point.x, point.y);
                };
                index++;
            });
        };
        if (item.stroke.width > 0) {
            view.context.fill();
            view.context.stroke();
        };
        view.context.closePath();
    };

    private text(item: TEXT) {
        view.context.beginPath();

        if (!item.hidden) {
            if (typeof (item.value) == "undefined" || item.value == null) {
                item.value = '';
            };
            let font = [item.font.size, 'px', ' ', item.font.family].join('');
            view.context.font = font;
            view.context.textAlign = item.font.alignment;
            view.context.fillStyle = item.font.color;
            view.context.textBaseline = item.font.baseline;

            if (item.font.alignment == 'right') {
                view.context.fillText(item.value, item.position.right, item.position.center.y);
            } else if (item.font.alignment == 'center') {
                view.context.fillText(item.value, item.position.center.x, item.position.center.y);
            } else if (item.font.alignment == 'left') {
                view.context.fillText(item.value, item.position.left, item.position.center.y);
            } else {
                view.context.fillText(item.value, item.position.center.x, item.position.center.y);
            };
        };

        if (item.hidden && this.editing) {
            view.context.rect(item.position.x, item.position.y, item.position.width, item.position.height);
            view.context.lineWidth = 1;
            view.context.strokeStyle = item.stroke.color;
            view.context.setLineDash([5, 2]);
            view.context.stroke();
        };

        view.context.closePath();
    };

    private chart(item: CHART) {
        const area = {
            'x': item.position.x + 50.5,
            'y': item.position.y,
            'top': item.position.top,
            'left': item.position.x + 50.5,
            'right': item.position.right,
            'width': item.position.width - 50.5,
            'height': item.position.height - 50.5,
            'bottom': item.position.bottom - 50.5
        };

        view.context.beginPath();

        view.context.lineCap = item.stroke.color;
        view.context.fillStyle = item.fill.color;
        view.context.lineWidth = item.stroke.width;
        view.context.strokeStyle = item.stroke.color;

        view.context.moveTo(area.x, area.y);
        view.context.lineTo(area.x, area.y + area.height);
        view.context.moveTo(area.x, area.y + area.height);
        
        view.context.fill();
        view.context.stroke();
        
        view.context.closePath();

        view.context.beginPath();

        view.context.lineCap = item.stroke.color;
        view.context.fillStyle = item.fill.color;
        view.context.lineWidth = item.stroke.width;
        view.context.strokeStyle = item.stroke.color;

        view.context.moveTo(area.x, area.bottom);
        view.context.lineTo(area.right, area.bottom);
        view.context.moveTo(area.right, area.bottom);
        
        view.context.fill();
        view.context.stroke();
        
        view.context.closePath();

        const stepY = (area.height / 10);
        for (let i = 0; i < 10; i++) {
            view.context.beginPath();

            view.context.lineCap = item.stroke.color;
            view.context.fillStyle = item.fill.color;
            view.context.lineWidth = item.stroke.width;
            view.context.strokeStyle = item.stroke.color;

            view.context.moveTo(area.left - 5, area.bottom - (stepY * i));
            view.context.lineTo(area.left, area.bottom - (stepY * i));
            view.context.moveTo(area.left, area.bottom - (stepY * i));
            
            view.context.fill();
            view.context.stroke();
            
            view.context.closePath();
        };

        const stepX = (area.width / 10);
        for (let i = 0; i < 10; i++) {
            view.context.beginPath();

            view.context.lineCap = item.stroke.color;
            view.context.fillStyle = item.fill.color;
            view.context.lineWidth = item.stroke.width;
            view.context.strokeStyle = item.stroke.color;

            view.context.moveTo(area.left + (stepX * i), area.bottom);
            view.context.lineTo(area.left + (stepX * i), area.bottom + 5);
            view.context.moveTo(area.left + (stepX * i), area.bottom + 5);
            
            view.context.fill();
            view.context.stroke();
            
            view.context.closePath();
        };


        view.context.beginPath();

        view.context.rect(area.left + 1 + 0.5, area.bottom - 1.5, stepX - 2 - 0.5, - (area.height * 0.5) + 1);

        view.context.fillStyle = 'rgba(63, 81, 181, 1)';
        view.context.fill();

        view.context.closePath();

        view.context.beginPath();

        view.context.rect(area.left + 3 +  stepX - 2 + 0.5, area.bottom - 1.5, stepX - 2 - 0.5, - (area.height * 0.75) + 1);

        view.context.fillStyle = 'rgba(63, 81, 181, 1)';
        view.context.fill();

        view.context.closePath();
    };

    private group(item: GROUP) {
        item.children.map(child => {
            if (child instanceof Arc) {
                this.arc(child);
            };
            if (child instanceof Line) {
                this.line(child);
            };
            if (child instanceof Text) {
                this.text(child);
            };
            if (child instanceof Chart) {
                this.chart(child);
            };
            if (child instanceof Group) {
                this.group(child);
            };
            if (child instanceof Circle) {
                this.circle(child);
            };
            if (child instanceof Button) {
                this.button(child);
            };
            if (child instanceof Vector) {
                this.vector(child);
            };
            if (child instanceof Polygon) {
                this.polygon(child);
            };
            if (child instanceof Rectangle) {
                this.rectangle(child);
            };
            if (child.selected) {
                new Select(child);
            };
        });
    };

    private circle(item: CIRCLE) {
        view.context.beginPath();

        view.context.ellipse(item.position.x + (item.position.width / 2), item.position.y + (item.position.height / 2), item.position.width / 2, item.position.height / 2, 0, 0, 2 * Math.PI);

        if (!item.hidden) {
            view.context.fillStyle = item.fill.color;
            view.context.fill();

            view.context.lineWidth = item.stroke.width;
            view.context.strokeStyle = item.stroke.color;
            if (item.stroke.width > 0) {
                view.context.stroke();
            };
        };

        if (item.hidden && this.editing) {
            view.context.lineWidth = 1;
            view.context.strokeStyle = item.stroke.color;
            view.context.setLineDash([5, 2]);
            view.context.stroke();
        };

        view.context.closePath();
    };

    private button(item: BUTTON) {
        view.context.beginPath();

        if (item.position.radius > item.position.width / 2) {
            item.position.radius = item.position.width / 2;
        } else if (item.position.radius > item.position.height / 2) {
            item.position.radius = item.position.height / 2;
        } else if (item.position.radius < 0) {
            item.position.radius = 0;
        };

        if (item.hidden && this.editing) {
            view.context.lineWidth = 1;
            view.context.strokeStyle = item.stroke.color;
            view.context.setLineDash([5, 2]);
        };

        view.context.moveTo(item.position.x + item.position.radius, item.position.y);
        view.context.arcTo(item.position.x + item.position.width, item.position.y, item.position.x + item.position.width, item.position.y + item.position.height, item.position.radius);
        view.context.arcTo(item.position.x + item.position.width, item.position.y + item.position.height, item.position.x, item.position.y + item.position.height, item.position.radius);
        view.context.arcTo(item.position.x, item.position.y + item.position.height, item.position.x, item.position.y, item.position.radius);
        view.context.arcTo(item.position.x, item.position.y, item.position.x + item.position.width, item.position.y, item.position.radius);

        if (item.hidden && this.editing) {
            view.context.stroke();
        };

        if (!item.hidden) {
            view.context.fillStyle = item.fill.color;
            view.context.fill();

            view.context.lineWidth = item.stroke.width;
            view.context.strokeStyle = item.stroke.color;
            if (item.stroke.width > 0) {
                view.context.stroke();
            };

            if (typeof (item.value) == "undefined" || item.value == null) {
                item.value = '';
            };
            let font = [item.font.size, 'px', ' ', item.font.family].join('');
            view.context.font = font;
            view.context.textAlign = item.font.alignment;
            view.context.fillStyle = item.font.color;
            view.context.textBaseline = item.font.baseline;
            view.context.fillText(item.value, item.position.center.x, item.position.center.y);
        };

        view.context.closePath();
    };

    private vector(item: VECTOR) {
        view.context.beginPath();

        if (!item.hidden) {
            view.context.drawImage(item.image, item.position.x, item.position.y, item.position.width, item.position.height);
        };

        if (item.hidden && this.editing) {
            view.context.rect(item.position.x, item.position.y, item.position.width, item.position.height);
            view.context.lineWidth = 1;
            view.context.strokeStyle = item.stroke.color;
            view.context.setLineDash([5, 2]);
            view.context.stroke();
        };

        view.context.closePath();
    };

    private polygon(item: POLYGON) {
        view.context.beginPath();

        if (!item.hidden) {
            view.context.lineCap = 'round';
            view.context.fillStyle = item.fill.color;
            view.context.lineWidth = item.stroke.width;
            view.context.strokeStyle = item.stroke.color;
        };

        if (Array.isArray(item.points)) {
            let index = 0;
            item.points.map(point => {
                if (index == 0) {
                    view.context.moveTo(Math.floor(point.x) - 0.5, Math.floor(point.y) - 0.5);
                } else {
                    view.context.lineTo(Math.floor(point.x) - 0.5, Math.floor(point.y) - 0.5);
                };
                index++;
            });
        };

        if (!item.hidden) {
            view.context.fill();
            if (item.stroke.width > 0) {
                view.context.stroke();
            };
        };

        if (item.hidden && this.editing) {
            view.context.lineWidth = 1;
            view.context.strokeStyle = item.stroke.color;
            view.context.setLineDash([5, 2]);
            view.context.stroke();
        };

        view.context.closePath();
    };

    private rectangle(item: RECTANGLE) {
        view.context.beginPath();
        
        if (1 == item.stroke.width % 2) {
            view.context.rect(Math.floor(item.position.x) - 0.5, Math.floor(item.position.y) - 0.5, Math.floor(item.position.width), Math.floor(item.position.height));
        } else {
            view.context.rect(Math.floor(item.position.x), Math.floor(item.position.y), Math.floor(item.position.width), Math.floor(item.position.height));
        };

        if (!item.hidden) {
            view.context.fillStyle = item.fill.color;
            view.context.fill();

            view.context.lineWidth = item.stroke.width;
            view.context.strokeStyle = item.stroke.color;

            if (item.stroke.width > 0) {
                view.context.stroke();
            };
        };

        if (item.hidden && this.editing) {
            view.context.lineWidth = 1;
            view.context.strokeStyle = item.stroke.color;
            view.context.setLineDash([5, 2]);
            view.context.stroke();
        };

        view.context.closePath();
    };

    private ImportArc(item) {
        return new Arc(item, true);
    };

    private ImportLine(item) {
        return new Line(item, true);
    };

    private ImportText(item) {
        return new Text(item, true);
    };

    private ImportChart(item) {
        return new Chart(item, true);
    };

    private ImportGroup(item) {
        item.children = item.children.map(child => {
            switch (child.type) {
                case ('arc'):
                    child = this.ImportArc(child);
                    break;
                case ('line'):
                    child = this.ImportLine(child);
                    break;
                case ('text'):
                    child = this.ImportText(child);
                    break;
                case ('group'):
                    child = this.ImportGroup(child);
                    break;
                case ('circle'):
                    child = this.ImportCircle(child);
                    break;
                case ('button'):
                    child = this.ImportButton(child);
                    break;
                case ('vector'):
                    child = this.ImportVector(child);
                    break;
                case ('polygon'):
                    child = this.ImportPolygon(child);
                    break;
                case ('rectangle'):
                    child = this.ImportRectangle(child);
                    break;
            };
            return child;
        });

        return new Group(item, true);
    };

    private ImportCircle(item) {
        return new Circle(item, true);
    };

    private ImportButton(item) {
        return new Button(item, true);
    };

    private ImportVector(item) {
        return new Vector(item, true);
    };

    private ImportPolygon(item) {
        return new Polygon(item, true);
    };

    private ImportRectangle(item) {
        return new Rectangle(item, true);
    };

    public async import(json: any[]) {
        json.map(item => {
            switch (item.type) {
                case ('arc'):
                    item = this.ImportArc(item);
                    break;
                case ('line'):
                    item = this.ImportLine(item);
                    break;
                case ('text'):
                    item = this.ImportText(item);
                    break;
                case ('chart'):
                    item = this.ImportChart(item);
                    break;
                case ('group'):
                    item = this.ImportGroup(item);
                    break;
                case ('circle'):
                    item = this.ImportCircle(item);
                    break;
                case ('button'):
                    item = this.ImportButton(item);
                    break;
                case ('vector'):
                    item = this.ImportVector(item);
                    break;
                case ('polygon'):
                    item = this.ImportPolygon(item);
                    break;
                case ('rectangle'):
                    item = this.ImportRectangle(item);
                    break;
            };

            data.push(item);
        });

        return true;
    };

    public select(position: POSITION) {
        if (typeof (position) !== "undefined" && position != null) {
            data.filter(item => {
                let hit = true;
                if (position.top > item.position.top) {
                    hit = false;
                };
                if (position.left > item.position.left) {
                    hit = false;
                };
                if (position.right < item.position.right) {
                    hit = false;
                };
                if (position.bottom < item.position.bottom) {
                    hit = false;
                };
                return hit;
            }).map(item => {
                if (this.editing) {
                    item.selected = true;
                };
            });
        };
    };

    public hit(point: POINT, radius?: number) {
        if (typeof (radius) == "undefined") {
            radius = 0;
        };
        let selected = data.filter(item => item.hit(point, radius)).sort((a, b) => {
            if (a.position.width < b.position.width) {
                return -1;
            } else if (a.position.width > b.position.width) {
                return 1;
            } else {
                return -1;
            };
        });
        if (selected.length > 0) {
            if (this.editing) {
                selected[0].selected = true;
            };
        };
    };

}
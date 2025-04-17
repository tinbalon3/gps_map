declare namespace atlas {
  export class Map {
    constructor(container: string, options: MapOptions);
    setCamera(options: CameraOptions): void;
    dispose(): void;
    events: EventManager;
    layers: LayerManager;
    sources: SourceManager;
    imageSprite: ImageSpriteManager;
  }

  export interface MapOptions {
    authOptions: AuthenticationOptions;
    center?: number[];
    zoom?: number;
    style?: string;
    language?: string;
  }

  export interface AuthenticationOptions {
    authType: AuthenticationType;
    subscriptionKey: string;
  }

  export class AuthenticationType {
    static subscriptionKey: string;
  }

  export interface CameraOptions {
    center?: number[];
    bounds?: any;
    zoom?: number;
    type?: string;
    duration?: number;
    padding?: number;
  }

  export class EventManager {
    add(type: string, callback: (e: any) => void): void;
  }

  export class LayerManager {
    add(layer: Layer): void;
    getLayerById(id: string): Layer | undefined;
  }

  export class SourceManager {
    add(source: Source): void;
  }

  export class ImageSpriteManager {
    add(id: string, url: string): void;
  }

  export namespace source {
    export class DataSource implements Source {
      constructor();
      add(shape: Shape): void;
      clear(): void;
    }
  }

  export namespace layer {
    export class SymbolLayer implements Layer {
      constructor(source: Source, id: string, options?: any);
    }
    export class LineLayer implements Layer {
      constructor(source: Source, id: string, options?: any);
    }
    export class PolygonLayer implements Layer {
      constructor(source: Source, id: string, options?: any);
    }
  }

  export interface Source {
    // Base interface for sources
  }

  export interface Layer {
    // Base interface for layers
  }

  export class Shape {
    constructor(data: any);
    addProperty(key: string, value: any): void;
  }

  export namespace data {
    export class Point {
      constructor(coordinates: number[]);
    }
    export class LineString {
      constructor(coordinates: number[][]);
    }
    export class Polygon {
      constructor(coordinates: number[][][]);
    }
    export class Feature {
      constructor(geometry: any);
    }
    export class BoundingBox {
      static fromData(data: any): any;
    }
  }

  export interface MapMouseEvent {
    position?: number[];
  }
}
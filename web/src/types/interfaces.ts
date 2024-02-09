// Most of these interfaces were generated by ChatGPT 4.0
// The 'I' prefix stands for 'interface', to disambiguate names.

import { IWidget, LGraph, LGraphCanvas, LGraphNode, Vector2 } from 'litegraph.js';
import { ComfyError, ComfyImages } from './many';
import { ComfyWidget } from './comfyWidget';
import { WorkflowStep } from '../../autogen_web_ts/comfy_request.v1';
import { ComfyObjectInfo } from './comfy';
import { IComfyApi } from './api';
import { SerializedGraph } from './litegraph';
import { ComfyGraph } from '../litegraph/comfyGraph.ts';

interface ComfyOptionsHost {
    el: Element;
    updateImages: (imgs: (HTMLImageElement | string)[]) => void;
    getHeight: () => void;
    onDraw: () => void;
}

export interface AddDOMWidgetOptions {
    host?: ComfyOptionsHost;
    getHeight?: ComfyOptionsHost['getHeight'];
    onDraw?: ComfyOptionsHost['onDraw'];
    hideOnZoom?: boolean;
    selectOn?: string[];
    getValue?: () => string | undefined;
    setValue?: (value: any) => string | undefined | void;
    beforeResize?: (node: IComfyNode) => void;
    afterResize?: (node: IComfyNode) => void;
}

export interface IComfyNode extends LGraphNode {
    category: any; // Replace 'any' with the actual type if known
    imageIndex?: number | null;
    imageOffset?: number;
    animatedImages?: any; // Replace 'any' with the actual type if known
    imgs?: HTMLImageElement[] | null;
    images?: any[]; // Replace 'any' with the actual type if known
    serialize_widgets: boolean;
    widgets: ComfyWidget[];
    resetExecution: boolean;
    pointerWasDown?: boolean | null;

    // Event handlers
    onGraphConfigured?: () => void;
    onAfterGraphConfigured?: () => void;
    onExecutionStart?: (...args: any[]) => void;
    onDragDrop?: (e: DragEvent) => boolean;
    onDragOver?: (e: DragEvent) => boolean;
    pasteFile?: (file: File) => boolean | object;
    onExecuted?: (output: any) => void;
    refreshComboInNode?: (defs: Record<string, ComfyObjectInfo>) => void;
    onResize?: (size: number[]) => void;
    callback?: (args: any) => void;

    // Additional properties
    inputHeight?: number | null;
    freeWidgetSpace?: number | null;
    imageRects?: [number, number, number, number][] | null;
    overIndex?: number | null;
    pointerDown?: { pos: Vector2; index: number | null } | null;
    preview?: HTMLImageElement | string | string[] | null;

    // Methods
    getWidgetType(inputData: any, inputName: string, app: IComfyApp): string | null;
    onKeyDown(e: KeyboardEvent): void;
    setSizeForImage(force?: boolean): void;
    onDrawBackground(ctx: CanvasRenderingContext2D): void;
    getExtraMenuOptions(context: any, options: { content: string; callback: () => void }[]): void;
    addDOMWidget(
        name: string,
        type: string,
        element: HTMLElement,
        options: AddDOMWidgetOptions
    ): ComfyWidget | undefined;
}

export interface SerializedNodeObject {
    imgs?: ComfyImages;
    images?: ComfyImages;
    selectedIndex: number;
    img_paste_mode: string;
    original_imgs?: ComfyImages;
    widgets?: ComfyWidget[] | null;
}

// The rough idea here, in the future, is that we can use functional composition for
// plugins, i.e., IComfyGraph extends ISerializegraph, and a bunch of other methods
// that are implemented on its class, for example.
// TO DO: consider adding this in the future for a plugin-system
// export interface ISerializeGraph {
//     serializeGraph(graph: IComfyGraph): { serializedGraph: SerializedGraph; apiWorkflow: Record<string, WorkflowStep> };
// }

export interface IComfyGraph extends LGraph<IComfyNode> {
    configure(data: object, keep_old?: boolean): boolean | undefined;
    onConfigure(data: object): void;

    serializeGraph(graph: IComfyGraph): { serializedGraph: SerializedGraph; apiWorkflow: Record<string, WorkflowStep> };

    // Overridden properties
    // nodes: IComfyNode[];

    // Overridden methods

    // add(node: IComfyNode, skip_compute_order?: boolean): void;
    // onNodeAdded(node: IComfyNode): void;
    // remove(node: IComfyNode): void;
    // getNodeById(id: number): IComfyNode | undefined;
    // getAncestors(node: IComfyNode): IComfyNode[];
    // beforeChange(info?: IComfyNode): void;
    // afterChange(info?: IComfyNode): void;
    // connectionChange(node: IComfyNode): void;

    // Uncomment and complete the following methods if they are public and should be included in the interface
    // findNodesByClass<T extends LGraphNode>(classObject: LGraphNodeConstructor<T>): T[];
    // findNodesByType<T extends IComfyNode = IComfyNode>(type: string): T[];
    // findNodeByTitle<T extends IComfyNode = IComfyNode>(title: string): T | null;
    // findNodesByTitle<T extends IComfyNode = IComfyNode>(title: string): T[];
    // getNodeOnPos<T extends IComfyNode = IComfyNode>(x: number, y: number, node_list?: IComfyNode[], margin?: number): T | null;
}

export interface IComfyCanvas extends LGraphCanvas<IComfyNode, IComfyGraph> {
    selected_group_moving: boolean;
    abortController: AbortController;

    // Methods
    // computeVisibleNodes(nodes: IComfyNode[]): IComfyNode[];
    // drawGroups(canvas: HTMLCanvasElement | string, ctx: CanvasRenderingContext2D): void;
    // drawNode(node: IComfyNode, ctx: CanvasRenderingContext2D): void;
    // drawNodeShape(
    //     node: IComfyNode,
    //     ctx: CanvasRenderingContext2D,
    //     size: [number, number],
    //     fgcolor: string,
    //     bgcolor: string,
    //     selected: boolean,
    //     mouse_over: boolean
    // ): void;

    // processKey(e: KeyboardEvent): boolean | undefined;
    // processMouseDown(e: MouseEvent): boolean | undefined;
    // processMouseMove(e: MouseEvent): boolean | undefined;

    resizeCanvas(): void;
    updateBackground(image: string, clearBackgroundColor: string): void;
    cleanup(): void;
}

export interface IComfyApp {
    queuePrompt(arg0: number, batchCount: number): unknown;
    // Public properties
    extensions: ComfyExtension[];
    nodeOutputs: Record<string, any>;
    nodePreviewImages: Record<string, HTMLImageElement | string | string[]>;
    shiftDown: boolean;
    api: IComfyApi;
    canvasEl: (HTMLCanvasElement & { id: string }) | null;
    canvas: IComfyCanvas | null;
    graph: IComfyGraph | null;
    ctx: CanvasRenderingContext2D | null;
    saveInterval: NodeJS.Timeout | null;
    dragOverNode?: IComfyNode | null;
    widgets: any; // Replace with actual type
    progress: any; // Replace with actual type
    runningNodeId: number | null;
    lastExecutionError: { node_id: number; message: string } | null;
    lastNodeErrors: Record<string, ComfyError> | null;
    configuringGraph: boolean;
    isNewUserSession: boolean;
    storageLocation: string | null;
    multiUserServer: boolean;
    elementWidgets: Set<IComfyNode>;

    // Public methods
    disableWorkflowAutoSave: () => void;
    enableWorkflowAutoSave: (graph: ComfyGraph) => void;
    open_maskeditor: (() => void) | null;
    isImageNode(node: IComfyNode): boolean;
    getPreviewFormatParam(): string;
    getRandParam(): string;
    onClipspaceEditorSave(): void;
    onClipspaceEditorClosed(): void;
    copyToClipspace(node: IComfyNode): void;
    pasteFromClipspace(node: IComfyNode): void;
    loadGraphData(graphData?: any, clean?: boolean): Promise<void>;
    graphToPrompt(): Promise<{ workflow: any; output: Record<string, WorkflowStep> }>;
    handleFile(file: File): Promise<void>;
    loadApiJson(apiData: Record<string, any>): void;
    refreshComboInNodes(): Promise<void>;
    clean(): void;
    cleanup(): void;

    // TODO: New
    getWidgetType(inputData: any, inputName: string): string | null;
}

export type GetCustomWidgetResponse = Record<
    string,
    (
        node: IComfyNode,
        inputName: string,
        inputData: any
        // app: IComfyApp
    ) => { widget?: IWidget; minWidth?: number; minHeight?: number }
>;

// What a web-extension can do:
// 1. define a new node type, or modify the list of node types
// 2. define new widget types

/** Interface custom-node extensions should conform to */
export interface ComfyExtension {
    // /** The name of the extension */
    name: string;

    /**
     * Allows any initialisation, e.g. loading resources. Called after the canvas is created but before nodes are added
     */
    init?(): Promise<void>;

    /**
     * Allows any additonal setup, called after the application is fully set up and running
     */
    setup?(): Promise<void>;

    beforeConfigureGraph?(graphData: object, missingNodeTypes: string[]): Promise<void>;

    afterConfigureGraph?(missingNodeTypes: string[]): Promise<void>;

    /**
     * Called before nodes are registered with the graph
     * @param defs The collection of node definitions, add custom ones or edit existing ones
     */
    addCustomNodeDefs?(defs: Record<string, ComfyObjectInfo>): Promise<void>;

    /**
     * Allows the extension to add custom widgets
     * @returns An array of {[widget name]: widget data}
     */
    getCustomWidgets?(): Promise<GetCustomWidgetResponse>;

    /**
     * Allows the extension to add additional handling to the node before it is registered with LGraph
     * @param nodeType The node class (not an instance)
     * @param nodeData The original node object info config object
     */
    beforeRegisterNodeDef?(nodeType: IComfyNode, nodeData: ComfyObjectInfo): Promise<void>;

    /**
     * Allows the extension to register additional nodes with LGraph after standard nodes are added
     */
    registerCustomNodes?(): Promise<void>;

    /**
     * Allows the extension to modify a node that has been reloaded onto the graph.
     * If you break something in the backend and want to patch workflows in the frontend
     * This is the place to do this
     * @param node The node that has been loaded
     */
    loadedGraphNode?(node: IComfyNode): Promise<void>;

    /**
     * Allows the extension to run code after the constructor of the node
     * @param node The node that has been created
     */
    nodeCreated?(node: LGraphNode): Promise<void>;

    /** Called when the app unmounts from the DOM
     * Cleanup any custom-resources used (i.e., listeners, timers, persistent connections, etc.)
     */
    cleanup?(): Promise<void>;
}

export interface IComfyClipspace {
    graph: ComfyGraph | null;

    clipspace: SerializedNodeObject | null;
    clipspace_return_node: IComfyNode | null;

    clipspace_invalidate_handler: (() => void) | null;
    openClipspace?: () => void;
}

export interface IComfyUserSettings {
    storageLocation: string | null;
    multiUserServer: boolean | null;
    isNewUserSession: boolean | null;
}

// TO DO: make this useful in the future
export interface Application {}

// `id` should be globally unique, like `core:my-extension`
export interface IComfyPlugin<T> {
    id: string;
    autoStart: boolean;
    requires?: string[];
    optional?: string[];
    provides?: string; // unique identifier for the class, object, or string provided
    activate: (app: Application, ...args: any[]) => Promise<T> | T;
    deactivate: (app: Application) => Promise<void> | void;
}

export interface ModuleWithPlugins<T> {
    default: IComfyPlugin<T>[] | IComfyPlugin<T>;
}

export interface LastExecutionError {
    node_id: number;
    message: string;
}

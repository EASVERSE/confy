import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";
import { $el, ComfyDialog } from "../../scripts/ui.js";
import { mergeIfValid } from "./widgetInputs.js";

const GROUP = Symbol();

const Workflow = {
	InUse: {
		Free: 0,
		Registered: 1,
		InWorkflow: 2,
	},
	isInUseGroupNode(name) {
		const id = `workflow/${name}`;
		// Check if lready registered/in use in this workflow
		if (app.graph.extra?.groupNodes?.[name]) {
			if (app.graph._nodes.find((n) => n.type === id)) {
				return Workflow.InUse.InWorkflow;
			} else {
				return Workflow.InUse.Registered;
			}
		}
		return Workflow.InUse.Free;
	},
	storeGroupNode(name, data) {
		let extra = app.graph.extra;
		if (!extra) app.graph.extra = extra = {};
		let groupNodes = extra.groupNodes;
		if (!groupNodes) extra.groupNodes = groupNodes = {};
		groupNodes[name] = data;
	},
};

// $el("style", {
// 	parent: document.body,
// 	textContent: `
// 		.comfy-group-manage {
// 			background: var(--bg-color);
// 			color: var(--fg-color);
// 			border: none;
// 			outline: none;
// 			padding: 0;
// 			font-family: Arial, sans-serif;
// 			border-radius: 10px;
// 			display: flex;
// 			flex-wrap: wrap;
// 			font-size: 0.8rem;
// 		}

// 		.comfy-group-manage header {
// 			flex-basis: 100%;
// 		}

// 		.comfy-group-manage h3 {
// 			font-size: 1rem;
// 		}

// 		.comfy-group-manage h3, .comfy-group-manage h4 {
// 			font-weight: normal;
// 			padding: 10px;
// 			margin: 0;
// 			border-bottom: 1px solid var(--border-color);
// 		}
		
// 		.comfy-group-manage ul {
// 			margin: 0;
// 			padding: 0;
// 			list-style: none;
// 			background: var(--tr-odd-bg-color);
// 		}
		
// 		.comfy-group-manage li {
// 			padding: 10px;
// 			cursor: pointer;
// 		}

// 		.comfy-group-manage li:hover, .comfy-group-manage li.selected {
// 			background: var(--tr-even-bg-color);
// 		}

// 		.comfy-group-manage li.selected {
// 			text-decoration: underline;
// 		}

// 		.comfy-group-manage main {
// 			border-left: 1px solid var(--border-color);
// 			flex: auto;
// 			background: var(--comfy-menu-bg);
// 		}
// 	`,
// });

// Tutorial: https://tahazsh.com/blog/seamless-ui-with-js-drag-to-reorder-example

/***********************
 *      Variables       *
 ***********************/

let listContainer

let draggableItem

let pointerStartX
let pointerStartY

let itemsGap = 0

let items = []

/***********************
 *    Helper Functions   *
 ***********************/

function getAllItems() {
  if (!items?.length) {
    items = Array.from(listContainer.querySelectorAll('.js-item'))
  }
  return items
}

function getIdleItems() {
  return getAllItems().filter((item) => item.classList.contains('is-idle'))
}

function isItemAbove(item) {
  return item.hasAttribute('data-is-above')
}

function isItemToggled(item) {
  return item.hasAttribute('data-is-toggled')
}

/***********************
 *        Setup        *
 ***********************/

function setup() {
  listContainer = document.querySelector('.js-list')

  if (!listContainer) return

  listContainer.addEventListener('mousedown', dragStart)
  listContainer.addEventListener('touchstart', dragStart)

  document.addEventListener('mouseup', dragEnd)
  document.addEventListener('touchend', dragEnd)
}

/***********************
 *     Drag Start      *
 ***********************/

function dragStart(e) {
  if (e.target.classList.contains('js-drag-handle')) {
    draggableItem = e.target.closest('.js-item')
  }

  if (!draggableItem) return

  pointerStartX = e.clientX || e.touches[0].clientX
  pointerStartY = e.clientY || e.touches[0].clientY

  setItemsGap()
  disablePageScroll()
  initDraggableItem()
  initItemsState()

  document.addEventListener('mousemove', drag)
  document.addEventListener('touchmove', drag, { passive: false })
}

function setItemsGap() {
  if (getIdleItems().length <= 1) {
    itemsGap = 0
    return
  }

  const item1 = getIdleItems()[0]
  const item2 = getIdleItems()[1]

  const item1Rect = item1.getBoundingClientRect()
  const item2Rect = item2.getBoundingClientRect()

  itemsGap = Math.abs(item1Rect.bottom - item2Rect.top)
}

function disablePageScroll() {
  document.body.style.overflow = 'hidden'
  document.body.style.touchAction = 'none'
  document.body.style.userSelect = 'none'
}

function initItemsState() {
  getIdleItems().forEach((item, i) => {
    if (getAllItems().indexOf(draggableItem) > i) {
      item.dataset.isAbove = ''
    }
  })
}

function initDraggableItem() {
  draggableItem.classList.remove('is-idle')
  draggableItem.classList.add('is-draggable')
}

/***********************
 *        Drag         *
 ***********************/

function drag(e) {
  if (!draggableItem) return

  e.preventDefault()

  const clientX = e.clientX || e.touches[0].clientX
  const clientY = e.clientY || e.touches[0].clientY

  const pointerOffsetX = clientX - pointerStartX
  const pointerOffsetY = clientY - pointerStartY

  draggableItem.style.transform = `translate(${pointerOffsetX}px, ${pointerOffsetY}px)`

  updateIdleItemsStateAndPosition()
}

function updateIdleItemsStateAndPosition() {
  const draggableItemRect = draggableItem.getBoundingClientRect()
  const draggableItemY = draggableItemRect.top + draggableItemRect.height / 2

  // Update state
  getIdleItems().forEach((item) => {
    const itemRect = item.getBoundingClientRect()
    const itemY = itemRect.top + itemRect.height / 2
    if (isItemAbove(item)) {
      if (draggableItemY <= itemY) {
        item.dataset.isToggled = ''
      } else {
        delete item.dataset.isToggled
      }
    } else {
      if (draggableItemY >= itemY) {
        item.dataset.isToggled = ''
      } else {
        delete item.dataset.isToggled
      }
    }
  })

  // Update position
  getIdleItems().forEach((item) => {
    if (isItemToggled(item)) {
      const direction = isItemAbove(item) ? 1 : -1
      item.style.transform = `translateY(${
        direction * (draggableItemRect.height + itemsGap)
      }px)`
    } else {
      item.style.transform = ''
    }
  })
}

/***********************
 *      Drag End       *
 ***********************/

function dragEnd() {
  if (!draggableItem) return

  applyNewItemsOrder()
  cleanup()
}

function applyNewItemsOrder() {
  const reorderedItems = []

  getAllItems().forEach((item, index) => {
    if (item === draggableItem) {
      return
    }
    if (!isItemToggled(item)) {
      reorderedItems[index] = item
      return
    }
    const newIndex = isItemAbove(item) ? index + 1 : index - 1
    reorderedItems[newIndex] = item
  })

  for (let index = 0; index < getAllItems().length; index++) {
    const item = reorderedItems[index]
    if (typeof item === 'undefined') {
      reorderedItems[index] = draggableItem
    }
  }

  reorderedItems.forEach((item) => {
    listContainer.appendChild(item)
  })
}

function cleanup() {
  itemsGap = 0
  items = []
  unsetDraggableItem()
  unsetItemState()

  document.removeEventListener('mousemove', drag)
  document.removeEventListener('touchmove', drag)
}

function unsetDraggableItem() {
  draggableItem.style = null
  draggableItem.classList.remove('is-draggable')
  draggableItem.classList.add('is-idle')
  draggableItem = null
}

function unsetItemState() {
  getIdleItems().forEach((item, i) => {
    delete item.dataset.isAbove
    delete item.dataset.isToggled
    item.style.transform = ''
  })
}

/***********************
 *      Start Here     *
 ***********************/


class ManageGroupDialog extends ComfyDialog {
	constructor(app) {
		super();
		this.app = app;
		this.element = $el("dialog.comfy-group-manage", {
			parent: document.body,
		});
	}

	update(groupId) {
		const def = LiteGraph.registered_node_types["workflow/" + groupId].nodeData;
		/**
		 * @type { GroupNodeConfig }
		 */
		const config = def[GROUP];
		debugger;
	}

	show() {

		this.element.innerHTML = `
			<style>
				.comfy-group-manage {
					background: var(--bg-color);
					color: var(--fg-color);
					padding: 0;
					font-family: Arial;
					border-color: black;
				}
				.comfy-group-manage-outer {
					min-width: 500px;
				}
				.comfy-group-manage-outer > header {
					display: flex; align-items: center; gap: 10px;
					justify-content: space-between;
					background: var(--comfy-menu-bg);
					padding: 15px 20px;
				}
				.comfy-group-manage-outer > header select {
					background: var(--comfy-input-bg);
					border: 1px solid var(--border-color);
					color: var(--input-text);
					padding: 5px 10px;
					border-radius: 5px;
				}
				.comfy-group-manage h2 {
					margin: 0;
					font-weight: normal;
				}
				.comfy-group-manage main {
					display: flex;
				}
				.comfy-group-manage .drag-handle {
					font-weight: bold;
				}
				.comfy-group-manage-list {
					border-right: 1px solid var(--comfy-menu-bg);
				}
				.comfy-group-manage-list ul {
					margin: 40px 0 0;
					padding: 0;
					list-style: none;
				}
				.comfy-group-manage-list li {
					display: flex;
					padding: 10px 20px 10px 10px;
					cursor: pointer;  
					align-items: center;
					gap: 5px;
				}
				.comfy-group-manage-list div {
					display: flex;
					flex-direction: column;
				}
				.comfy-group-manage-list li:not(.selected):hover div{
					text-decoration: underline;
				}
				.comfy-group-manage-list li.selected {
					background: var(--border-color);
				}
				.comfy-group-manage-list li span {
					opacity: 0.7;
					font-size: smaller;
				}

				.comfy-group-manage-node {
					flex: auto;
					background: var(--border-color);
				}
				.comfy-group-manage-node header {
					display: flex;
					background: var(--bg-color);
					height: 40px;
				}
				.comfy-group-manage-node header a {
					text-align: center;
					flex: auto;
					border-right: 1px solid var(--comfy-menu-bg);
					border-bottom: 1px solid var(--comfy-menu-bg);
					padding: 10px;
					cursor: pointer;
				}
				.comfy-group-manage-node header a:not(.active):hover {
					text-decoration: underline;
				}
				.comfy-group-manage-node header a.active {
					background: var(--border-color);
					border-bottom: none;
				}
				.comfy-group-manage-node > div {
					padding: 10px;
					display: flex;
					align-items: center;
					gap: 10px;
				}
				.comfy-group-manage-node input {
					border: none;
					color: var(--input-text);
					background: var(--comfy-input-bg);
					padding: 5px 10px;
				}
				.comfy-group-manage footer {
					border-top: 1px solid var(--comfy-menu-bg);
					padding: 10px;
					display: flex;
					gap: 10px;
				}
				.comfy-group-manage footer button {
					font-size: 14px;
					padding: 5px 10px;
					border-radius: 0;
				}
				.comfy-group-manage footer button:first-child {
					margin-right: auto;
				}
			</style>
			<div class="comfy-group-manage-outer">
				<header>
					<h2>Group Nodes</h2>
					<select>
						<option>Example Group Node</option>
					</select>
				</header>
				<main>
					<section class="comfy-group-manage-list">
						<ul>
							<li class="selected"><span class="drag-handle"></span><div>Load Checkpoint<span>CheckpointLoaderSimple</span></div></li>
							<li><span class="drag-handle"></span><div>1st Pass<span>KSampler</span></div></li>
							<li><span class="drag-handle"></span><div>Latent Upscale<span>LatentUpscale</span></div></li>
							<li><span class="drag-handle"></span><div>2nd Pass<span>KSampler</span></div></li>
						</ul>
					</section>
					<section class="comfy-group-manage-node">
						<header>
							<a>Inputs</a>
							<a class="active">Widgets</a>
							<a>Outputs</a>
						</header>
						<div>
							<label>
								ckpt_loader
								<input value="ckpt_loader"> 
							</label>
							<label>Visible <input type="checkbox"></label>
						</div>
					</section>
				</main>
				<footer>
					<button class="comfy-button">Delete</button>
					<button class="comfy-button">Save</button>
					<button class="comfy-button">Close</button>
				</footer>
			</div>
		`

		// const groupNodes = Object.keys(app.graph.extra?.groupNodes ?? {}).concat([
		// 	"something",
		// 	"another",
		// 	"prompt",
		// 	"chatgpt",
		// 	"upscale 4x",
		// ]);
		// if (!groupNodes.length) return;

		// let selected;
		// const items = groupNodes.map((g) =>
		// 	$el("li", {
		// 		textContent: g,
		// 		onclick: (e) => {
		// 			if (selected) {
		// 				selected.classList.remove("selected");
		// 			}
		// 			selected = e.target;
		// 			selected.classList.add("selected");
		// 			this.update(g);
		// 		},
		// 	})
		// );
		// const left = $el("div.comfy-group-manage-list", $el("ul", items));

		// const inputs = $el("div", [$el("h4", "Inputs")]);
		// this.inputsList = $el("div", { parent: inputs });
		// const widgets = $el("div", [$el("h4", "Widgets")]);
		// this.widgetsList = $el("div", { parent: widgets });
		// const outputs = $el("div", [$el("h4", "Outputs")]);
		// this.outputsList = $el("div", { parent: outputs });
		// const main = $el("main", [ inputs, widgets, outputs]);

		// this.element.replaceChildren($el("header", $el("h3", "Group Nodes")), left, main);
		this.element.showModal();
		
setup()

		// items[0].click();
	}
}

class GroupNodeBuilder {
	constructor(nodes) {
		this.nodes = nodes;
	}

	build() {
		const name = this.getName();
		if (!name) return;

		// Sort the nodes so they are in execution order
		// this allows for widgets to be in the correct order when reconstructing
		this.sortNodes();

		this.nodeData = this.getNodeData();
		Workflow.storeGroupNode(name, this.nodeData);

		return { name, nodeData: this.nodeData };
	}

	getName() {
		const name = prompt("Enter group name");
		if (!name) return;
		const used = Workflow.isInUseGroupNode(name);
		switch (used) {
			case Workflow.InUse.InWorkflow:
				alert(
					"An in use group node with this name already exists embedded in this workflow, please remove any instances or use a new name."
				);
				return;
			case Workflow.InUse.Registered:
				if (
					!confirm(
						"An group node with this name already exists embedded in this workflow, are you sure you want to overwrite it?"
					)
				) {
					return;
				}
				break;
		}
		return name;
	}

	sortNodes() {
		// Gets the builders nodes in graph execution order
		const nodesInOrder = app.graph.computeExecutionOrder(false);
		this.nodes = this.nodes
			.map((node) => ({ index: nodesInOrder.indexOf(node), node }))
			.sort((a, b) => a.index - b.index || a.node.id - b.node.id)
			.map(({ node }) => node);
	}

	getNodeData() {
		const storeLinkTypes = (config) => {
			// Store link types for dynamically typed nodes e.g. reroutes
			for (const link of config.links) {
				const origin = app.graph.getNodeById(link[4]);
				const type = origin.outputs[link[1]].type;
				link.push(type);
			}
		};

		const storeExternalLinks = (config) => {
			// Store any external links to the group in the config so when rebuilding we add extra slots
			config.external = [];
			for (let i = 0; i < this.nodes.length; i++) {
				const node = this.nodes[i];
				if (!node.outputs?.length) continue;
				for (let slot = 0; slot < node.outputs.length; slot++) {
					let hasExternal = false;
					const output = node.outputs[slot];
					let type = output.type;
					if (!output.links?.length) continue;
					for (const l of output.links) {
						const link = app.graph.links[l];
						if (!link) continue;
						if (type === "*") type = link.type;

						if (!app.canvas.selected_nodes[link.target_id]) {
							hasExternal = true;
							break;
						}
					}
					if (hasExternal) {
						config.external.push([i, slot, type]);
					}
				}
			}
		};

		// Use the built in copyToClipboard function to generate the node data we need
		const backup = localStorage.getItem("litegrapheditor_clipboard");
		try {
			app.canvas.copyToClipboard(this.nodes);
			const config = JSON.parse(localStorage.getItem("litegrapheditor_clipboard"));

			storeLinkTypes(config);
			storeExternalLinks(config);

			return config;
		} finally {
			localStorage.setItem("litegrapheditor_clipboard", backup);
		}
	}
}

export class GroupNodeConfig {
	constructor(name, nodeData) {
		this.name = name;
		this.nodeData = nodeData;
		this.getLinks();

		this.inputCount = 0;
		this.oldToNewOutputMap = {};
		this.newToOldOutputMap = {};
		this.oldToNewInputMap = {};
		this.oldToNewWidgetMap = {};
		this.newToOldWidgetMap = {};
		this.primitiveDefs = {};
		this.widgetToPrimitive = {};
		this.primitiveToWidget = {};
	}

	async registerType(source = "workflow") {
		this.nodeDef = {
			output: [],
			output_name: [],
			output_is_list: [],
			name: source + "/" + this.name,
			display_name: this.name,
			category: "group nodes" + ("/" + source),
			input: { required: {} },

			[GROUP]: this,
		};

		this.inputs = [];
		const seenInputs = {};
		const seenOutputs = {};
		for (let i = 0; i < this.nodeData.nodes.length; i++) {
			const node = this.nodeData.nodes[i];
			node.index = i;
			this.processNode(node, seenInputs, seenOutputs);
		}

		for (const p of this.#convertedToProcess) {
			p();
		}
		this.#convertedToProcess = null;
		await app.registerNodeDef("workflow/" + this.name, this.nodeDef);
	}

	getLinks() {
		this.linksFrom = {};
		this.linksTo = {};
		this.externalFrom = {};

		// Extract links for easy lookup
		for (const l of this.nodeData.links) {
			const [sourceNodeId, sourceNodeSlot, targetNodeId, targetNodeSlot] = l;

			// Skip links outside the copy config
			if (sourceNodeId == null) continue;

			if (!this.linksFrom[sourceNodeId]) {
				this.linksFrom[sourceNodeId] = {};
			}
			if (!this.linksFrom[sourceNodeId][sourceNodeSlot]) {
				this.linksFrom[sourceNodeId][sourceNodeSlot] = [];
			}
			this.linksFrom[sourceNodeId][sourceNodeSlot].push(l);

			if (!this.linksTo[targetNodeId]) {
				this.linksTo[targetNodeId] = {};
			}
			this.linksTo[targetNodeId][targetNodeSlot] = l;
		}

		if (this.nodeData.external) {
			for (const ext of this.nodeData.external) {
				if (!this.externalFrom[ext[0]]) {
					this.externalFrom[ext[0]] = { [ext[1]]: ext[2] };
				} else {
					this.externalFrom[ext[0]][ext[1]] = ext[2];
				}
			}
		}
	}

	processNode(node, seenInputs, seenOutputs) {
		const def = this.getNodeDef(node);
		if (!def) return;

		const inputs = { ...def.input?.required, ...def.input?.optional };

		this.inputs.push(this.processNodeInputs(node, seenInputs, inputs));
		if (def.output?.length) this.processNodeOutputs(node, seenOutputs, def);
	}

	getNodeDef(node) {
		const def = globalDefs[node.type];
		if (def) return def;

		const linksFrom = this.linksFrom[node.index];
		if (node.type === "PrimitiveNode") {
			// Skip as its not linked
			if (!linksFrom) return;

			let type = linksFrom["0"][0][5];
			if (type === "COMBO") {
				// Use the array items
				const source = node.outputs[0].widget.name;
				const fromTypeName = this.nodeData.nodes[linksFrom["0"][0][2]].type;
				const fromType = globalDefs[fromTypeName];
				const input = fromType.input.required[source] ?? fromType.input.optional[source];
				type = input[0];
			}

			const def = (this.primitiveDefs[node.index] = {
				input: {
					required: {
						value: [type, {}],
					},
				},
				output: [type],
				output_name: [],
				output_is_list: [],
			});
			return def;
		} else if (node.type === "Reroute") {
			const linksTo = this.linksTo[node.index];
			if (linksTo && linksFrom && !this.externalFrom[node.index]?.[0]) {
				// Being used internally
				return null;
			}

			let config = {};
			let rerouteType = "*";
			if (linksFrom) {
				for (const [, , id, slot] of linksFrom["0"]) {
					const node = this.nodeData.nodes[id];
					const input = node.inputs[slot];
					if (rerouteType === "*") {
						rerouteType = input.type;
					}
					if (input.widget) {
						const targetDef = globalDefs[node.type];
						const targetWidget =
							targetDef.input.required[input.widget.name] ?? targetDef.input.optional[input.widget.name];

						const widget = [targetWidget[0], config];
						const res = mergeIfValid(
							{
								widget,
							},
							targetWidget,
							false,
							null,
							widget
						);
						config = res?.customConfig ?? config;
					}
				}
			} else if (linksTo) {
				const [id, slot] = linksTo["0"];
				rerouteType = this.nodeData.nodes[id].outputs[slot].type;
			} else {
				// Reroute used as a pipe
				for (const l of this.nodeData.links) {
					if (l[2] === node.index) {
						rerouteType = l[5];
						break;
					}
				}
				if (rerouteType === "*") {
					// Check for an external link
					const t = this.externalFrom[node.index]?.[0];
					if (t) {
						rerouteType = t;
					}
				}
			}

			config.forceInput = true;
			return {
				input: {
					required: {
						[rerouteType]: [rerouteType, config],
					},
				},
				output: [rerouteType],
				output_name: [],
				output_is_list: [],
			};
		}

		console.warn("Skipping virtual node " + node.type + " when building group node " + this.name);
	}

	getInputConfig(node, inputName, seenInputs, config, extra) {
		let name = node.inputs?.find((inp) => inp.name === inputName)?.label ?? inputName;
		let prefix = "";
		// Special handling for primitive to include the title if it is set rather than just "value"
		if ((node.type === "PrimitiveNode" && node.title) || name in seenInputs) {
			prefix = `${node.title ?? node.type} `;
			name = `${prefix}${inputName}`;
			if (name in seenInputs) {
				name = `${prefix}${seenInputs[name]} ${inputName}`;
			}
		}
		seenInputs[name] = (seenInputs[name] ?? 1) + 1;

		if (inputName === "seed" || inputName === "noise_seed") {
			if (!extra) extra = {};
			extra.control_after_generate = `${prefix}control_after_generate`;
		}
		if (config[0] === "IMAGEUPLOAD") {
			if (!extra) extra = {};
			extra.widget = `${prefix}${config[1]?.widget ?? "image"}`;
		}

		if (extra) {
			config = [config[0], { ...config[1], ...extra }];
		}

		return { name, config };
	}

	processWidgetInputs(inputs, node, inputNames, seenInputs) {
		const slots = [];
		const converted = new Map();
		const widgetMap = (this.oldToNewWidgetMap[node.index] = {});
		for (const inputName of inputNames) {
			let widgetType = app.getWidgetType(inputs[inputName], inputName);
			if (widgetType) {
				const convertedIndex = node.inputs?.findIndex(
					(inp) => inp.name === inputName && inp.widget?.name === inputName
				);
				if (convertedIndex > -1) {
					// This widget has been converted to a widget
					// We need to store this in the correct position so link ids line up
					converted.set(convertedIndex, inputName);
					widgetMap[inputName] = null;
				} else {
					// Normal widget
					const { name, config } = this.getInputConfig(node, inputName, seenInputs, inputs[inputName]);
					this.nodeDef.input.required[name] = config;
					widgetMap[inputName] = name;
					this.newToOldWidgetMap[name] = { node, inputName };
				}
			} else {
				// Normal input
				slots.push(inputName);
			}
		}
		return { converted, slots };
	}

	checkPrimitiveConnection(link, inputName, inputs) {
		const sourceNode = this.nodeData.nodes[link[0]];
		if (sourceNode.type === "PrimitiveNode") {
			// Merge link configurations
			const [sourceNodeId, _, targetNodeId, __] = link;
			const primitiveDef = this.primitiveDefs[sourceNodeId];
			const targetWidget = inputs[inputName];
			const primitiveConfig = primitiveDef.input.required.value;
			const output = { widget: primitiveConfig };
			const config = mergeIfValid(output, targetWidget, false, null, primitiveConfig);
			primitiveConfig[1] = config?.customConfig ?? inputs[inputName][1] ? { ...inputs[inputName][1] } : {};

			let name = this.oldToNewWidgetMap[sourceNodeId]["value"];
			name = name.substr(0, name.length - 6);
			primitiveConfig[1].control_after_generate = true;
			primitiveConfig[1].control_prefix = name;

			let toPrimitive = this.widgetToPrimitive[targetNodeId];
			if (!toPrimitive) {
				toPrimitive = this.widgetToPrimitive[targetNodeId] = {};
			}
			if (toPrimitive[inputName]) {
				toPrimitive[inputName].push(sourceNodeId);
			}
			toPrimitive[inputName] = sourceNodeId;

			let toWidget = this.primitiveToWidget[sourceNodeId];
			if (!toWidget) {
				toWidget = this.primitiveToWidget[sourceNodeId] = [];
			}
			toWidget.push({ nodeId: targetNodeId, inputName });
		}
	}

	processInputSlots(inputs, node, slots, linksTo, inputMap, seenInputs) {
		for (let i = 0; i < slots.length; i++) {
			const inputName = slots[i];
			if (linksTo[i]) {
				this.checkPrimitiveConnection(linksTo[i], inputName, inputs);
				// This input is linked so we can skip it
				continue;
			}

			const { name, config } = this.getInputConfig(node, inputName, seenInputs, inputs[inputName]);
			this.nodeDef.input.required[name] = config;
			inputMap[i] = this.inputCount++;
		}
	}

	processConvertedWidgets(inputs, node, slots, converted, linksTo, inputMap, seenInputs) {
		// Add converted widgets sorted into their index order (ordered as they were converted) so link ids match up
		const convertedSlots = [...converted.keys()].sort().map((k) => converted.get(k));
		for (let i = 0; i < convertedSlots.length; i++) {
			const inputName = convertedSlots[i];
			if (linksTo[slots.length + i]) {
				this.checkPrimitiveConnection(linksTo[slots.length + i], inputName, inputs);
				// This input is linked so we can skip it
				continue;
			}

			const { name, config } = this.getInputConfig(node, inputName, seenInputs, inputs[inputName], {
				defaultInput: true,
			});
			this.nodeDef.input.required[name] = config;
			this.newToOldWidgetMap[name] = { node, inputName };

			if (!this.oldToNewWidgetMap[node.index]) {
				this.oldToNewWidgetMap[node.index] = {};
			}
			this.oldToNewWidgetMap[node.index][inputName] = name;

			inputMap[slots.length + i] = this.inputCount++;
		}
	}

	#convertedToProcess = [];
	processNodeInputs(node, seenInputs, inputs) {
		const inputMapping = [];

		const inputNames = Object.keys(inputs);
		if (!inputNames.length) return;

		const { converted, slots } = this.processWidgetInputs(inputs, node, inputNames, seenInputs);
		const linksTo = this.linksTo[node.index] ?? {};
		const inputMap = (this.oldToNewInputMap[node.index] = {});
		this.processInputSlots(inputs, node, slots, linksTo, inputMap, seenInputs);

		// Converted inputs have to be processed after all other nodes as they'll be at the end of the list
		this.#convertedToProcess.push(() =>
			this.processConvertedWidgets(inputs, node, slots, converted, linksTo, inputMap, seenInputs)
		);

		return inputMapping;
	}

	processNodeOutputs(node, seenOutputs, def) {
		const oldToNew = (this.oldToNewOutputMap[node.index] = {});

		// Add outputs
		for (let outputId = 0; outputId < def.output.length; outputId++) {
			const linksFrom = this.linksFrom[node.index];
			if (linksFrom?.[outputId] && !this.externalFrom[node.index]?.[outputId]) {
				// This output is linked internally so we can skip it
				continue;
			}

			oldToNew[outputId] = this.nodeDef.output.length;
			this.newToOldOutputMap[this.nodeDef.output.length] = { node, slot: outputId };
			this.nodeDef.output.push(def.output[outputId]);
			this.nodeDef.output_is_list.push(def.output_is_list[outputId]);

			let label = def.output_name?.[outputId] ?? def.output[outputId];
			const output = node.outputs.find((o) => o.name === label);
			if (output?.label) {
				label = output.label;
			}
			let name = label;
			if (name in seenOutputs) {
				const prefix = `${node.title ?? node.type} `;
				name = `${prefix}${label}`;
				if (name in seenOutputs) {
					name = `${prefix}${node.index} ${label}`;
				}
			}
			seenOutputs[name] = 1;

			this.nodeDef.output_name.push(name);
		}
	}

	static async registerFromWorkflow(groupNodes, missingNodeTypes) {
		const clean = app.clean;
		app.clean = function () {
			for (const g in groupNodes) {
				try {
					LiteGraph.unregisterNodeType("workflow/" + g);
				} catch (error) {}
			}
			app.clean = clean;
		};

		for (const g in groupNodes) {
			const groupData = groupNodes[g];

			let hasMissing = false;
			for (const n of groupData.nodes) {
				// Find missing node types
				if (!(n.type in LiteGraph.registered_node_types)) {
					missingNodeTypes.push({
						type: n.type,
						hint: ` (In group node 'workflow/${g}')`,
					});

					missingNodeTypes.push({
						type: "workflow/" + g,
						action: {
							text: "Remove from workflow",
							callback: (e) => {
								delete groupNodes[g];
								e.target.textContent = "Removed";
								e.target.style.pointerEvents = "none";
								e.target.style.opacity = 0.7;
							},
						},
					});

					hasMissing = true;
				}
			}

			if (hasMissing) continue;

			const config = new GroupNodeConfig(g, groupData);
			await config.registerType();
		}
	}
}

export class GroupNodeHandler {
	node;
	groupData;

	constructor(node) {
		this.node = node;
		this.groupData = node.constructor?.nodeData?.[GROUP];

		this.node.setInnerNodes = (innerNodes) => {
			this.innerNodes = innerNodes;

			for (let innerNodeIndex = 0; innerNodeIndex < this.innerNodes.length; innerNodeIndex++) {
				const innerNode = this.innerNodes[innerNodeIndex];

				for (const w of innerNode.widgets ?? []) {
					if (w.type === "converted-widget") {
						w.serializeValue = w.origSerializeValue;
					}
				}

				innerNode.index = innerNodeIndex;
				innerNode.getInputNode = (slot) => {
					// Check if this input is internal or external
					const externalSlot = this.groupData.oldToNewInputMap[innerNode.index]?.[slot];
					if (externalSlot != null) {
						return this.node.getInputNode(externalSlot);
					}

					// Internal link
					const innerLink = this.groupData.linksTo[innerNode.index]?.[slot];
					if (!innerLink) return null;

					const inputNode = innerNodes[innerLink[0]];
					// Primitives will already apply their values
					if (inputNode.type === "PrimitiveNode") return null;

					return inputNode;
				};

				innerNode.getInputLink = (slot) => {
					const externalSlot = this.groupData.oldToNewInputMap[innerNode.index]?.[slot];
					if (externalSlot != null) {
						// The inner node is connected via the group node inputs
						const linkId = this.node.inputs[externalSlot].link;
						let link = app.graph.links[linkId];

						// Use the outer link, but update the target to the inner node
						link = {
							...link,
							target_id: innerNode.id,
							target_slot: +slot,
						};
						return link;
					}

					let link = this.groupData.linksTo[innerNode.index]?.[slot];
					if (!link) return null;
					// Use the inner link, but update the origin node to be inner node id
					link = {
						origin_id: innerNodes[link[0]].id,
						origin_slot: link[1],
						target_id: innerNode.id,
						target_slot: +slot,
					};
					return link;
				};
			}
		};

		this.node.updateLink = (link) => {
			// Replace the group node reference with the internal node
			link = { ...link };
			const output = this.groupData.newToOldOutputMap[link.origin_slot];
			let innerNode = this.innerNodes[output.node.index];
			let l;
			while (innerNode?.type === "Reroute") {
				l = innerNode.getInputLink(0);
				innerNode = innerNode.getInputNode(0);
			}

			if (!innerNode) {
				return null;
			}

			if (l && GroupNodeHandler.isGroupNode(innerNode)) {
				return innerNode.updateLink(l);
			}

			link.origin_id = innerNode.id;
			link.origin_slot = l?.origin_slot ?? output.slot;
			return link;
		};

		this.node.getInnerNodes = () => {
			if (!this.innerNodes) {
				this.node.setInnerNodes(
					this.groupData.nodeData.nodes.map((n, i) => {
						const innerNode = LiteGraph.createNode(n.type);
						innerNode.configure(n);
						innerNode.id = `${this.node.id}:${i}`;
						return innerNode;
					})
				);
			}

			this.updateInnerWidgets();

			return this.innerNodes;
		};

		this.node.convertToNodes = () => {
			const addInnerNodes = () => {
				const backup = localStorage.getItem("litegrapheditor_clipboard");
				// Clone the node data so we dont mutate it for other nodes
				const c = { ...this.groupData.nodeData };
				c.nodes = [...c.nodes];
				const innerNodes = this.node.getInnerNodes();
				let ids = [];
				for (let i = 0; i < c.nodes.length; i++) {
					let id = innerNodes?.[i]?.id;
					// Use existing IDs if they are set on the inner nodes
					if (id == null || isNaN(id)) {
						id = undefined;
					} else {
						ids.push(id);
					}
					c.nodes[i] = { ...c.nodes[i], id };
				}
				localStorage.setItem("litegrapheditor_clipboard", JSON.stringify(c));
				app.canvas.pasteFromClipboard();
				localStorage.setItem("litegrapheditor_clipboard", backup);

				const [x, y] = this.node.pos;
				let top;
				let left;
				// Configure nodes with current widget data
				const selectedIds = ids.length ? ids : Object.keys(app.canvas.selected_nodes);
				const newNodes = [];
				for (let i = 0; i < selectedIds.length; i++) {
					const id = selectedIds[i];
					const newNode = app.graph.getNodeById(id);
					const innerNode = innerNodes[i];
					newNodes.push(newNode);

					if (left == null || newNode.pos[0] < left) {
						left = newNode.pos[0];
					}
					if (top == null || newNode.pos[1] < top) {
						top = newNode.pos[1];
					}

					if (!newNode.widgets) continue;

					const map = this.groupData.oldToNewWidgetMap[innerNode.index];
					if (map) {
						const widgets = Object.keys(map);

						for (const oldName of widgets) {
							const newName = map[oldName];
							if (!newName) continue;

							const widgetIndex = this.node.widgets.findIndex((w) => w.name === newName);
							if (widgetIndex === -1) continue;

							// Populate the main and any linked widgets
							if (innerNode.type === "PrimitiveNode") {
								for (let i = 0; i < newNode.widgets.length; i++) {
									newNode.widgets[i].value = this.node.widgets[widgetIndex + i].value;
								}
							} else {
								const outerWidget = this.node.widgets[widgetIndex];
								const newWidget = newNode.widgets.find((w) => w.name === oldName);
								if (!newWidget) continue;

								newWidget.value = outerWidget.value;
								for (let w = 0; w < outerWidget.linkedWidgets?.length; w++) {
									newWidget.linkedWidgets[w].value = outerWidget.linkedWidgets[w].value;
								}
							}
						}
					}
				}

				// Shift each node
				for (const newNode of newNodes) {
					newNode.pos = [newNode.pos[0] - (left - x), newNode.pos[1] - (top - y)];
				}

				return { newNodes, selectedIds };
			};

			const reconnectInputs = (selectedIds) => {
				for (const innerNodeIndex in this.groupData.oldToNewInputMap) {
					const id = selectedIds[innerNodeIndex];
					const newNode = app.graph.getNodeById(id);
					const map = this.groupData.oldToNewInputMap[innerNodeIndex];
					for (const innerInputId in map) {
						const groupSlotId = map[innerInputId];
						if (groupSlotId == null) continue;
						const slot = node.inputs[groupSlotId];
						if (slot.link == null) continue;
						const link = app.graph.links[slot.link];
						//  connect this node output to the input of another node
						const originNode = app.graph.getNodeById(link.origin_id);
						originNode.connect(link.origin_slot, newNode, +innerInputId);
					}
				}
			};

			const reconnectOutputs = (selectedIds) => {
				for (let groupOutputId = 0; groupOutputId < node.outputs?.length; groupOutputId++) {
					const output = node.outputs[groupOutputId];
					if (!output.links) continue;
					const links = [...output.links];
					for (const l of links) {
						const slot = this.groupData.newToOldOutputMap[groupOutputId];
						const link = app.graph.links[l];
						const targetNode = app.graph.getNodeById(link.target_id);
						const newNode = app.graph.getNodeById(selectedIds[slot.node.index]);
						newNode.connect(slot.slot, targetNode, link.target_slot);
					}
				}
			};

			const { newNodes, selectedIds } = addInnerNodes();
			reconnectInputs(selectedIds);
			reconnectOutputs(selectedIds);
			app.graph.remove(this.node);

			return newNodes;
		};

		const getExtraMenuOptions = this.node.getExtraMenuOptions;
		this.node.getExtraMenuOptions = function (_, options) {
			getExtraMenuOptions?.apply(this, arguments);

			let optionIndex = options.findIndex((o) => o.content === "Outputs");
			if (optionIndex === -1) optionIndex = options.length;
			else optionIndex++;
			options.splice(
				optionIndex,
				0,
				null,
				{
					content: "Convert to nodes",
					callback: () => {
						return this.convertToNodes();
					},
				},
				{
					content: "Manage Group Node",
					callback: () => {
						new ManageGroupDialog(app).show(this.type);
					},
				}
			);
		};

		// Draw custom collapse icon to identity this as a group
		const onDrawTitleBox = this.node.onDrawTitleBox;
		this.node.onDrawTitleBox = function (ctx, height, size, scale) {
			onDrawTitleBox?.apply(this, arguments);

			const fill = ctx.fillStyle;
			ctx.beginPath();
			ctx.rect(11, -height + 11, 2, 2);
			ctx.rect(14, -height + 11, 2, 2);
			ctx.rect(17, -height + 11, 2, 2);
			ctx.rect(11, -height + 14, 2, 2);
			ctx.rect(14, -height + 14, 2, 2);
			ctx.rect(17, -height + 14, 2, 2);
			ctx.rect(11, -height + 17, 2, 2);
			ctx.rect(14, -height + 17, 2, 2);
			ctx.rect(17, -height + 17, 2, 2);

			ctx.fillStyle = this.boxcolor || LiteGraph.NODE_DEFAULT_BOXCOLOR;
			ctx.fill();
			ctx.fillStyle = fill;
		};

		// Draw progress label
		const onDrawForeground = node.onDrawForeground;
		const groupData = this.groupData.nodeData;
		node.onDrawForeground = function (ctx) {
			const r = onDrawForeground?.apply?.(this, arguments);
			if (+app.runningNodeId === this.id && this.runningInternalNodeId !== null) {
				const n = groupData.nodes[this.runningInternalNodeId];
				const message = `Running ${n.title || n.type} (${this.runningInternalNodeId}/${groupData.nodes.length})`;
				ctx.save();
				ctx.font = "12px sans-serif";
				const sz = ctx.measureText(message);
				ctx.fillStyle = node.boxcolor || LiteGraph.NODE_DEFAULT_BOXCOLOR;
				ctx.beginPath();
				ctx.roundRect(0, -LiteGraph.NODE_TITLE_HEIGHT - 20, sz.width + 12, 20, 5);
				ctx.fill();

				ctx.fillStyle = "#fff";
				ctx.fillText(message, 6, -LiteGraph.NODE_TITLE_HEIGHT - 6);
				ctx.restore();
			}
		};

		// Flag this node as needing to be reset
		const onExecutionStart = this.node.onExecutionStart;
		this.node.onExecutionStart = function () {
			this.resetExecution = true;
			return onExecutionStart?.apply(this, arguments);
		};

		function handleEvent(type, getId, getEvent) {
			const handler = ({ detail }) => {
				const id = getId(detail);
				if (!id) return;
				const node = app.graph.getNodeById(id);
				if (node) return;

				const innerNodeIndex = this.innerNodes?.findIndex((n) => n.id == id);
				if (innerNodeIndex > -1) {
					this.node.runningInternalNodeId = innerNodeIndex;
					api.dispatchEvent(new CustomEvent(type, { detail: getEvent(detail, this.node.id + "", this.node) }));
				}
			};
			api.addEventListener(type, handler);
			return handler;
		}

		const executing = handleEvent.call(
			this,
			"executing",
			(d) => d,
			(d, id, node) => id
		);

		const executed = handleEvent.call(
			this,
			"executed",
			(d) => d?.node,
			(d, id, node) => ({ ...d, node: id, merge: !node.resetExecution })
		);

		const onRemoved = node.onRemoved;
		this.node.onRemoved = function () {
			onRemoved?.apply(this, arguments);
			api.removeEventListener("executing", executing);
			api.removeEventListener("executed", executed);
		};
	}

	updateInnerWidgets() {
		for (const newWidgetName in this.groupData.newToOldWidgetMap) {
			const newWidget = this.node.widgets.find((w) => w.name === newWidgetName);
			if (!newWidget) continue;

			const newValue = newWidget.value;
			const old = this.groupData.newToOldWidgetMap[newWidgetName];
			let innerNode = this.innerNodes[old.node.index];

			if (innerNode.type === "PrimitiveNode") {
				innerNode.primitiveValue = newValue;
				const primitiveLinked = this.groupData.primitiveToWidget[old.node.index];
				for (const linked of primitiveLinked ?? []) {
					const node = this.innerNodes[linked.nodeId];
					const widget = node.widgets.find((w) => w.name === linked.inputName);

					if (widget) {
						widget.value = newValue;
					}
				}
				continue;
			} else if (innerNode.type === "Reroute") {
				const rerouteLinks = this.groupData.linksFrom[old.node.index];
				if (rerouteLinks) {
					for (const [_, , targetNodeId, targetSlot] of rerouteLinks["0"]) {
						const node = this.innerNodes[targetNodeId];
						const input = node.inputs[targetSlot];
						if (input.widget) {
							const widget = node.widgets?.find((w) => w.name === input.widget.name);
							if (widget) {
								widget.value = newValue;
							}
						}
					}
				}
			}

			const widget = innerNode.widgets?.find((w) => w.name === old.inputName);
			if (widget) {
				widget.value = newValue;
			}
		}
	}

	populatePrimitive(node, nodeId, oldName, i, linkedShift) {
		// Converted widget, populate primitive if linked
		const primitiveId = this.groupData.widgetToPrimitive[nodeId]?.[oldName];
		if (primitiveId == null) return;
		const targetWidgetName = this.groupData.oldToNewWidgetMap[primitiveId]["value"];
		const targetWidgetIndex = this.node.widgets.findIndex((w) => w.name === targetWidgetName);
		if (targetWidgetIndex > -1) {
			const primitiveNode = this.innerNodes[primitiveId];
			let len = primitiveNode.widgets.length;
			if (len - 1 !== this.node.widgets[targetWidgetIndex].linkedWidgets?.length) {
				// Fallback handling for if some reason the primitive has a different number of widgets
				// we dont want to overwrite random widgets, better to leave blank
				len = 1;
			}
			for (let i = 0; i < len; i++) {
				this.node.widgets[targetWidgetIndex + i].value = primitiveNode.widgets[i].value;
			}
		}
		return true;
	}

	populateReroute(node, nodeId, map) {
		if (node.type !== "Reroute") return;

		const link = this.groupData.linksFrom[nodeId]?.[0]?.[0];
		if (!link) return;
		const [, , targetNodeId, targetNodeSlot] = link;
		const targetNode = this.groupData.nodeData.nodes[targetNodeId];
		const inputs = targetNode.inputs;
		const targetWidget = inputs?.[targetNodeSlot].widget;
		if (!targetWidget) return;

		const offset = inputs.length - (targetNode.widgets_values?.length ?? 0);
		const v = targetNode.widgets_values?.[targetNodeSlot - offset];
		if (v == null) return;

		const widgetName = Object.values(map)[0];
		const widget = this.node.widgets.find((w) => w.name === widgetName);
		if (widget) {
			widget.value = v;
		}
	}

	populateWidgets() {
		if (!this.node.widgets) return;

		for (let nodeId = 0; nodeId < this.groupData.nodeData.nodes.length; nodeId++) {
			const node = this.groupData.nodeData.nodes[nodeId];
			const map = this.groupData.oldToNewWidgetMap[nodeId] ?? {};
			const widgets = Object.keys(map);

			if (!node.widgets_values?.length) {
				// special handling for populating values into reroutes
				// this allows primitives connect to them to pick up the correct value
				this.populateReroute(node, nodeId, map);
				continue;
			}

			let linkedShift = 0;
			for (let i = 0; i < widgets.length; i++) {
				const oldName = widgets[i];
				const newName = map[oldName];
				const widgetIndex = this.node.widgets.findIndex((w) => w.name === newName);
				const mainWidget = this.node.widgets[widgetIndex];
				if (this.populatePrimitive(node, nodeId, oldName, i, linkedShift)) {
					// Find the inner widget and shift by the number of linked widgets as they will have been removed too
					const innerWidget = this.innerNodes[nodeId].widgets?.find((w) => w.name === oldName);
					linkedShift += innerWidget.linkedWidgets?.length ?? 0;
				}
				if (widgetIndex === -1) {
					continue;
				}

				// Populate the main and any linked widget
				mainWidget.value = node.widgets_values[i + linkedShift];
				for (let w = 0; w < mainWidget.linkedWidgets?.length; w++) {
					this.node.widgets[widgetIndex + w + 1].value = node.widgets_values[i + ++linkedShift];
				}
			}
		}
	}

	replaceNodes(nodes) {
		let top;
		let left;

		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i];
			if (left == null || node.pos[0] < left) {
				left = node.pos[0];
			}
			if (top == null || node.pos[1] < top) {
				top = node.pos[1];
			}

			this.linkOutputs(node, i);
			app.graph.remove(node);
		}

		this.linkInputs();
		this.node.pos = [left, top];
	}

	linkOutputs(originalNode, nodeId) {
		if (!originalNode.outputs) return;

		for (const output of originalNode.outputs) {
			if (!output.links) continue;
			// Clone the links as they'll be changed if we reconnect
			const links = [...output.links];
			for (const l of links) {
				const link = app.graph.links[l];
				if (!link) continue;

				const targetNode = app.graph.getNodeById(link.target_id);
				const newSlot = this.groupData.oldToNewOutputMap[nodeId]?.[link.origin_slot];
				if (newSlot != null) {
					this.node.connect(newSlot, targetNode, link.target_slot);
				}
			}
		}
	}

	linkInputs() {
		for (const link of this.groupData.nodeData.links ?? []) {
			const [, originSlot, targetId, targetSlot, actualOriginId] = link;
			const originNode = app.graph.getNodeById(actualOriginId);
			if (!originNode) continue; // this node is in the group
			originNode.connect(originSlot, this.node.id, this.groupData.oldToNewInputMap[targetId][targetSlot]);
		}
	}

	static getGroupData(node) {
		return node.constructor?.nodeData?.[GROUP];
	}

	static isGroupNode(node) {
		return !!node.constructor?.nodeData?.[GROUP];
	}

	static async fromNodes(nodes) {
		// Process the nodes into the stored workflow group node data
		const builder = new GroupNodeBuilder(nodes);
		const res = builder.build();
		if (!res) return;

		const { name, nodeData } = res;

		// Convert this data into a LG node definition and register it
		const config = new GroupNodeConfig(name, nodeData);
		await config.registerType();

		const groupNode = LiteGraph.createNode(`workflow/${name}`);
		// Reuse the existing nodes for this instance
		groupNode.setInnerNodes(builder.nodes);
		groupNode[GROUP].populateWidgets();
		app.graph.add(groupNode);

		// Remove all converted nodes and relink them
		groupNode[GROUP].replaceNodes(builder.nodes);
		return groupNode;
	}
}

function addConvertToGroupOptions() {
	function addConvertOption(options, index) {
		const selected = Object.values(app.canvas.selected_nodes ?? {});
		const disabled = selected.length < 2 || selected.find((n) => GroupNodeHandler.isGroupNode(n));
		options.splice(index + 1, null, {
			content: `Convert to Group Node`,
			disabled,
			callback: async () => {
				return await GroupNodeHandler.fromNodes(selected);
			},
		});
	}

	function addManageOption(options, index) {
		const groups = app.graph.extra?.groupNodes;
		const disabled = !groups || !Object.keys(groups).length;
		options.splice(index + 1, null, {
			content: `Manage Group Nodes`,
			disabled,
			callback: () => {
				new ManageGroupDialog(app).show();
			},
		});
	}

	// Add to canvas
	const getCanvasMenuOptions = LGraphCanvas.prototype.getCanvasMenuOptions;
	LGraphCanvas.prototype.getCanvasMenuOptions = function () {
		const options = getCanvasMenuOptions.apply(this, arguments);
		const index = options.findIndex((o) => o?.content === "Add Group") + 1 || options.length;
		addConvertOption(options, index);
		addManageOption(options, index + 1);
		return options;
	};

	// Add to nodes
	const getNodeMenuOptions = LGraphCanvas.prototype.getNodeMenuOptions;
	LGraphCanvas.prototype.getNodeMenuOptions = function (node) {
		const options = getNodeMenuOptions.apply(this, arguments);
		if (!GroupNodeHandler.isGroupNode(node)) {
			const index = options.findIndex((o) => o?.content === "Outputs") + 1 || options.length - 1;
			addConvertOption(options, index);
		}
		return options;
	};
}

const id = "Comfy.GroupNode";
let globalDefs;
const ext = {
	name: id,
	setup() {
		addConvertToGroupOptions();
	},
	async beforeConfigureGraph(graphData, missingNodeTypes) {
		const nodes = graphData?.extra?.groupNodes;
		if (nodes) {
			await GroupNodeConfig.registerFromWorkflow(nodes, missingNodeTypes);
		}
	},
	addCustomNodeDefs(defs) {
		// Store this so we can mutate it later with group nodes
		globalDefs = defs;
	},
	nodeCreated(node) {
		if (GroupNodeHandler.isGroupNode(node)) {
			node[GROUP] = new GroupNodeHandler(node);
		}
	},
};

app.registerExtension(ext);

setTimeout(() => {
	new ManageGroupDialog(app).show();
}, 200);
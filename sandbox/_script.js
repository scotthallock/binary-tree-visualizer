/**
 * Definition for a binary tree node.
 */
class TreeNode {
    constructor (val, left, right) {
        this.val = (val===undefined ? 0 : val);
        this.left = (left===undefined ? null : left);
        this.right = (right===undefined ? null : right);
    }

    static traverse(root, path) {
        let node = root;
        while (path.length > 0) {
            if (path[0] === 'l') {
                node = node.left;
            }
            else if (path[0] === 'r') {
                node = node.right;
            }
            else {
                throw new Error (`Traversal path string can only contain 'l' or 'r'.`);
            }
            path = path.slice(1);
        }
        return node;
    }

    static traverseToParent(root, path) {
        return TreeNode.traverse(root, path.slice(0, path.length-1));
    }

    delete(path) {
        let root = this;
        const parent = TreeNode.traverseToParent(root, path);
        const next = path[path.length - 1];
        if (next === 'l') {
            parent.left = null;
        } else if (next === 'r') {
            parent.right = null;
        } else {
            throw new Error (`Traversal path string can only contain 'l' or 'r'.`);
        }
    }

    insert(path, value = 0) {
        let root = this;
        const parent = TreeNode.traverseToParent(root, path);
        const next = path[path.length - 1];
        if (next === 'l') {
            parent.left = new TreeNode(value);
        } else if (next === 'r') {
            parent.right = new TreeNode(value);
        } else {
            throw new Error (`Traversal path string can only contain 'l' or 'r'.`);
        }
    }

    static maxDepth(root) {
        if (root === null) return 0;
        return Math.max(this.maxDepth(root.left), this.maxDepth(root.right)) + 1;
    }
}

const buildTreeFromArray = (arr) => {
    if (arr.length === 0) return null;
    const root = new TreeNode(arr.shift());
    const queue = [root];
    while(queue.length > 0 && arr.length > 0) {
        const currNode = queue.shift();
        const leftVal = arr.shift();
        const rightVal = arr.shift();

        // support both null elements and empty (undefined) elements
        if (leftVal !== null && leftVal !== undefined) {
            currNode.left = new TreeNode(leftVal);
            queue.push(currNode.left);
        }
        if (rightVal !== null && rightVal !== undefined) {
            currNode.right = new TreeNode(rightVal);
            queue.push(currNode.right);
        }
    }
    return root;
};

const updateTreeArray = (root) => {
    if (root === null) {
        d3.select('#tree-array-input').node().value = JSON.stringify([]);
        return;
    }

    const arr = [root.val];
    const queue = [root];
    
    // BFS algorithm to create array from tree
    while (queue.length > 0) {
        const node = queue.shift();
        if (node.left) {
            arr.push(node.left.val);
            queue.push(node.left);
        } else {
            arr.push(null);
        }
        if (node.right) {
            arr.push(node.right.val);
            queue.push(node.right);
        } else {
            arr.push(null);
        }
    }

    // trim nulls off the end of the array
    while (arr[arr.length - 1] === null) arr.pop();

    // update input field
    d3.select('#tree-array-input').node().value = JSON.stringify(arr);
};

const renderTreeGraphic = (root) => {
    // Clear contents of display before re-drawing
    const displaySVG = d3.select('#svg-display');
    displaySVG.selectAll('*').remove();
    displaySVG.append('g')
        .attr('id', 'svg-tree');
    const treeSVG = d3.select('#svg-tree');

    const MIN_HORIZ_DIST = 50; // Distance between nodes at deepest level of tree.
    const MAX_DEPTH_LIMIT = 5; // Maximum tree depth set to 5 (32 nodes total).
    const dy = 100;
    const treeDepth = TreeNode.maxDepth(root);
    const displayWidth = displaySVG.node().getBoundingClientRect().width;

    // empty tree, draw a message
    if (root === null) {
        drawEmptyTree(treeSVG, displayWidth / 2, dy);
        return;
    };

    // BFS traverse through tree and create SVG elements
    const queue = [[root, 1, displayWidth / 2, dy, '']]; // [node, depth, x, y, pathID]
    while (queue.length > 0) {
        const [node, depth, x, y, pathID] = queue.shift();

        // Calculate horizontal offset of child nodes.
        const dx = (Math.pow(2, treeDepth - 1) * MIN_HORIZ_DIST) / Math.pow(2, depth);

        // coloration of nodes
        if (node.left) {
            drawNodeBranchSVG(treeSVG, x, y, x-dx, y+dy);
            queue.push([node.left, depth+1, x-dx, y+dy, pathID+'l']);
        } else if (pathID.length < MAX_DEPTH_LIMIT - 1) {
            drawNewNodeAreaSVG(treeSVG, x, y, x-dx, y+dy, pathID+'l');
        }
        if (node.right) {
            drawNodeBranchSVG(treeSVG, x, y, x+dx, y+dy);
            queue.push([node.right, depth+1, x+dx, y+dy, pathID+'r']);
        } else if (pathID.length < MAX_DEPTH_LIMIT - 1) {
            drawNewNodeAreaSVG(treeSVG, x, y, x+dx, y+dy, pathID+'r');
        }
        let nodeClasses = 'node' + (!node.left && !node.right ? ' leaf' : ''); 
        drawNodeCircleSVG(treeSVG, x, y, nodeClasses, pathID);
        drawNodeValueSVG(treeSVG, x, y, node.val);
    }
    transformTreeSVG(treeSVG, displaySVG); // center and scale tree

    /**
     * Event Listners:
     * 1) Add a new node
     * 2) Edit a node's value
     * 3) Delete a node
     */
    d3.selectAll('.new-node-area').on('click', e => {
        console.log('CLICKED NEW NODE AREA');
        const path = e.target.id;
        binaryTreeRoot.insert(path, 0); // 0 will be default value
        updateTreeArray(binaryTreeRoot);
        renderTreeGraphic(binaryTreeRoot);
    });
    d3.selectAll('.node').on('mouseup', e => {
        if (e.which === 1) {
            drawEditNodeValueField(e.target);
        } else if (e.which === 3) {
            const path = e.target.id;
            if (path === '') { // deleting root node
                binaryTreeRoot = null;
            } else {
                binaryTreeRoot.delete(path);
            }
            updateTreeArray(binaryTreeRoot);
            renderTreeGraphic(binaryTreeRoot);
        }
    });
};

const drawEmptyTree = (svg, x, y) => {
    const group = svg.append('g')
        .attr('class', 'empty-tree-message-group');
    group.append('text')
        .attr('x', x)
        .attr('y', y)
        .attr('text-anchor', 'middle') // horizontally center text
        .attr('dy', '7') // y offset text
        .text('(empty tree)');
    group.append('text')
        .attr('class', 'empty-tree-message')
        .attr('x', x)
        .attr('y', y + 25)
        .attr('text-anchor', 'middle') // horizontally center text
        .attr('dy', '7') // y offset text
        .text('click to add root node')
    group.on('click', () => {
            document.getElementById('tree-array-input').value = '[0]';
            binaryTreeRoot = new TreeNode(0);
            renderTreeGraphic(binaryTreeRoot);
    });
};

const drawNodeCircleSVG = (svg, x, y, nodeClasses, pathID) => {
    svg.append('circle')
        .attr('class', nodeClasses)
        .attr('id', pathID)
        .attr('r', 20) // fixed 20px radius
        .attr('cx', x)
        .attr('cy', y);
};

const drawNodeValueSVG = (svg, x, y, val) => {
    svg.append('text')
        .attr('class', 'node-val')
        .attr('x', x)
        .attr('y', y)
        .attr('text-anchor', 'middle') // horizontally center text in node
        .attr('dy', '7') // y offset text so it appears in center of node
        .text(val);
};

const drawNodeBranchSVG = (svg, x1, y1, x2, y2) => {
    const arrowPoints = [[0, 0], [0, 20], [20, 10]];
    svg.append('line')
        .attr('class', 'branch')
        .attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2);
};

const drawNewNodeAreaSVG = (svg, x1, y1, x2, y2, id) => {
    const group = svg.append('g')
        .attr('class', 'new-node-area')
        // .attr('id', id);

    let x = Math.min(x1, x2);
    if (x1 > x2) x -= 20;
    let width = Math.abs(x1 - x2) + 20;
    
    group.append('rect')
        .attr('class', 'new-node-boundary')
        .attr('id', id)
        .attr('x', x)
        .attr('y', y1)
        .attr('width', width)
        .attr('height', y2 - y1 + 20);
    group.append('line')
        .attr('class', 'branch new-branch')
        .attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2);
    group.append('circle')
        .attr('class', 'node new-node')
        .attr('r', 20)
        .attr('cx', x2)
        .attr('cy', y2);
};

const drawEditNodeValueField = (target) => {
    const rect = target.getBoundingClientRect();
    const inputContainer = d3.select('#svg-container')
        .append('div')
        .attr('class', 'edit-value-container')
        .style('position', 'absolute')
        .style('width', rect.width+'px')
        .style('height', rect.height+'px')
        .style('left', rect.x+'px')
        .style('top', rect.y+'px');

    const path = target.id;
    const currValue = TreeNode.traverse(binaryTreeRoot, path).val;

    const input = inputContainer.append('input')
        .attr('class', 'edit-value-input');
    input.node().focus();
    input.node().value = currValue;
    input.node().select();

    /**
     * Event listeners:
     * 1. User presses enter -> update node value.
     * 2. User pressese escape -> node value is NOT updated.
     * 3. User clicks outside of field -> update node value.
     */
    let userEscaped = false;
    input.on('keyup', (e) => {
        if (e.key === 'Enter' || e.keyCode === 13) {
            input.node().blur();
        } else if (e.key === 'Esc' || e.keyCode === 27) {
            userEscaped = true;
            input.node().blur();
        }
    });
    input.on('blur', () => {
        let newValue = userEscaped ? currValue : input.node().value;
        // parse the new value as a number, if it can be
        if (!isNaN(newValue) && newValue !== '') {
            newValue = parseFloat(newValue);
        }
        // editNodeValue(target, newValue);
        // goToNode(target.id, editNodeValue, newValue);
        TreeNode.traverse(binaryTreeRoot, path).val = newValue;
        inputContainer.remove();
        updateTreeArray(binaryTreeRoot);
        renderTreeGraphic(binaryTreeRoot);
    });
};

const transformTreeSVG = (tree, display) => {
    let treeRect = tree.node().getBoundingClientRect();
    const displayRect = display.node().getBoundingClientRect();

    // scale tree
    let scale = 1;
    if (treeRect.width > displayRect.width) {
        scale = Math.max(displayRect.width / treeRect.width * 0.95, 0.5);
    }
    tree.attr('transform', `scale(${scale})`);

    // updated bounding box of scaled tree
    treeRect = tree.node().getBoundingClientRect();

    // center tree horizontally
    const treeCenter = treeRect.x + treeRect.width / 2;
    const displayCenter = displayRect.x + displayRect.width / 2;
    tree.attr('transform', `translate(${displayCenter - treeCenter}, 0) scale(${scale})`);
};

const randomBinaryTree = (maxDepth, valueGenerator = () => 0) => {
    const root = new TreeNode(valueGenerator());
    const rootCopy = root;

    const childProbability = 0.75;

    const queue = [[root, 1]];
    while (queue.length > 0) {
        const [node, depth] = queue.shift();
        if(Math.random() < childProbability && depth < maxDepth) {
            node.left = new TreeNode(valueGenerator);
            queue.push([node.left, depth + 1]);
        }
        if(Math.random() < childProbability && depth < maxDepth) {
            node.right = new TreeNode(valueGenerator);
            queue.push([node.right, depth + 1]);
        }
    }
    return rootCopy;
}


// TREE DATA
let binaryTreeRoot = null;

// START APP
const startApp = () => {
    // Create <svg> element and <g> element to group all tree nodes and branches
    const $svg = d3.select('#svg-container')
        .append('svg')
        .attr('id', 'svg-display')
        .append('g')
        .attr('id', 'svg-tree');

    // get DOM elements
    const $treeArrayInput = document.getElementById('tree-array-input');

    // default treeArrayInput value
    $treeArrayInput.value = '[1,2,0,3,4,0,null,5,null,6,7,null,0]';

    // Event listeners
    d3.select('#array-to-tree').on('click', () => {
        binaryTreeRoot = buildTreeFromArray(JSON.parse($treeArrayInput.value));
        renderTreeGraphic(binaryTreeRoot);
    });
    d3.select('#random-tree').on('click', () => {
        binaryTreeRoot = randomBinaryTree(5, () => {
            return Math.floor(Math.random() * 100);
        });
        updateTreeArray(binaryTreeRoot);
        renderTreeGraphic(binaryTreeRoot);
    });

    binaryTreeRoot = buildTreeFromArray(JSON.parse($treeArrayInput.value));
    renderTreeGraphic(binaryTreeRoot);

    const $menuItems = document.querySelectorAll('.menu-bar-list-item');
    const $expandIcons = document.querySelectorAll('.expand-icon');
    const $collapsibles = document.querySelectorAll('.collapsible');

    $menuItems.forEach(($menuItem, i) => {
        $menuItem.addEventListener('click', () => {
            const alreadyIsActive = $menuItem.classList.contains('active');
            $menuItems.forEach($menuItem => $menuItem.classList.remove('active'));
            $expandIcons.forEach($expandIcon => $expandIcon.classList.remove('active'));
            $collapsibles.forEach($collapsible => $collapsible.classList.remove('active'));
            if (!alreadyIsActive) {
                $menuItem.classList.add('active');
                $expandIcons[i].classList.add('active');
                $collapsibles[i].classList.add('active');
            }
        });
    });

};

startApp();
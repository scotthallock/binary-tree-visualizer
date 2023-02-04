/**
 * Definition for a binary tree node.
 */
class TreeNode {
    constructor (val, left, right) {
        this.val = (val===undefined ? 0 : val);
        this.left = (left===undefined ? null : left);
        this.right = (right===undefined ? null : right);
    }
}

/**
 * @param {Array} arr 
 * @returns {TreeNode}
 */
const buildTreeFromArray = (arr) => {
    const root = new TreeNode(arr.shift());
    const queue = [root];
    while(queue.length > 0 && arr.length > 0) {
        const currNode = queue.shift();
        const leftVal = arr.shift();
        const rightVal = arr.shift();
        console.log({currNode, leftVal, rightVal})

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


/**
 * @param {TreeNode} root
 * @returns {}
 */
const renderTreeGraphic = (root) => {
    if (root === null) return;

    const MIN_HORIZ_DIST = 100; // horizontal distance between nodes at max depth
    const dy = 100;
    const treeDepth = maxDepth(root);

    const displaySVG = d3.select('#svg-display');
    displaySVG.selectAll('*').remove(); // clear contents
    displaySVG.append('g')
        .attr('id', 'svg-tree');
    const treeSVG = d3.select('#svg-tree');

    const displayWidth = displaySVG.node().getBoundingClientRect().width;


    // BFS traverse through tree and create SVG elements
    const queue = [[root, 1, displayWidth / 2, dy, 's']]; // [node, depth, x, y, pathID]
    while (queue.length > 0) {
        const [node, depth, x, y, pathID] = queue.shift();

        // calculate horizontal offset of child nodes
        const dx = (treeDepth - depth + 1) * (MIN_HORIZ_DIST / 2);

        let nodeClasses = 'node'; // coloration of nodes
        if (node.left) {
            drawNodeBranchSVG(treeSVG, x, y, x-dx, y+dy);
            queue.push([node.left, depth+1, x-dx, y+dy, pathID+'l']);
        } else {
            nodeClasses += ' no-left';
            drawNewNodeAreaSVG(treeSVG, x, y, x-dx, y+dy, pathID+'l');
        }
        if (node.right) {
            drawNodeBranchSVG(treeSVG, x, y, x+dx, y+dy);
            queue.push([node.right, depth+1, x+dx, y+dy, pathID+'r']);
        } else {
            nodeClasses += ' no-right';
            drawNewNodeAreaSVG(treeSVG, x, y, x+dx, y+dy, pathID+'r');
        }
        drawNodeCircleSVG(treeSVG, x, y, nodeClasses);
        drawNodeValueSVG(treeSVG, x, y, node.val);
    }
    centerHorizontally(treeSVG, displaySVG); // center the tree in the display

    // add event listeners to 'insert node areas'
    d3.selectAll('.new-node-area')
        .on('click', e => {
            insertNodeInTree(e.target.id);
            console.log('you clicked an insert node area with id ', e.target.id);
        });
};

const drawNodeCircleSVG = (svg, x, y, nodeClasses) => {
    svg.append('circle')
        .attr('class', nodeClasses)
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
        .attr('id', id);
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

const centerHorizontally = (tree, display) => {
    const treeRect = tree.node().getBoundingClientRect();
    const treeCenter = treeRect.x + treeRect.width / 2;
    const displayRect = display.node().getBoundingClientRect();
    const displayCenter = displayRect.x + displayRect.width / 2;
    tree.attr('transform', `translate(${displayCenter - treeCenter}, 0)`)
};

const insertNodeInTree = (pathID, val = 0) => {
    let node = binaryTreeRoot;
    // remove first character 's'
    pathID = pathID.slice(1);

    while (pathID.length > 1) {
        if (pathID[0] === 'l')
            node = node.left;
        else if (pathID[0] === 'r')
            node = node.right;
        else throw new Error('Unable to parse pathID.');
        pathID = pathID.slice(1);
    }

    if (pathID[0] === 'l')
        node.left = new TreeNode(val);
    else if (pathID[0] === 'r')
        node.right = new TreeNode(val);
    else throw new Error('Unable to parse pathID.');

    renderTreeGraphic(binaryTreeRoot);
};


/**
 * @param {TreeNode} node 
 * @returns {Number}
 */
const maxDepth = (root) => {
    if (root === null) return 0;
    const leftDepth = maxDepth(root.left);
    const rightDepth = maxDepth(root.right);
    return Math.max(leftDepth, rightDepth) + 1; // count current node
};

// TREE DATA
let binaryTreeRoot = null;


// START APP
const startApp = () => {
    const $svg = d3.select('#svg-container')
        .append('svg')
        .attr('id', 'svg-display')
        .append('g')
        .attr('id', 'svg-tree');

    console.log('on creation...')
    console.log(d3.select('#svg-tree').node().getBoundingClientRect());

    // get DOM elements
    const $treeArrayInput = d3.select('#tree-array').node();

    // default treeArrayInput value
    $treeArrayInput.value = '[1, 2, null, 3, 4, 5, null, 6, 7]';

    // Event listeners
    d3.selectAll('#generate-tree').on('click', () => {
        binaryTreeRoot = buildTreeFromArray(JSON.parse($treeArrayInput.value));
        renderTreeGraphic(binaryTreeRoot);
    });

    binaryTreeRoot = buildTreeFromArray(JSON.parse($treeArrayInput.value));
    renderTreeGraphic(binaryTreeRoot);
};

startApp();
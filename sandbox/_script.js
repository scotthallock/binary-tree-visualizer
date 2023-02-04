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

        // support both null elements and empty (undefined) elements
        if (leftVal !== null && leftVal !== undefined) {
            currNode.left = new TreeNode(leftVal);
            queue.push(currNode.left);
        }
        if (rightVal !== null && leftVal !== undefined) {
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
    const yOffset = 100;
    const treeDepth = maxDepth(root);

    const displaySVG = d3.select('#svg-display');
    displaySVG.selectAll('*').remove(); // clear contents
    displaySVG.append('g')
        .attr('id', 'svg-tree');
    const treeSVG = d3.select('#svg-tree');

    const displayWidth = displaySVG.node().getBoundingClientRect().width;

    // BFS traverse through tree and create SVG elements
    const queue = [[root, 1, displayWidth / 2, yOffset]]; // [node, depth, xPos, yPos]
    while (queue.length > 0) {
        const [node, depth, xPos, yPos] = queue.shift();

        // calculate horizontal offset of child nodes
        const xOffset = (treeDepth - depth) * (MIN_HORIZ_DIST / 2);

        if (node.left) {
            drawNodeBranchSVG(treeSVG, xPos, yPos, xPos - xOffset, yPos + yOffset);
            queue.push([
                node.left,
                depth + 1,
                xPos - xOffset,
                yPos + yOffset
            ]);
        }
        if (node.right) {
            drawNodeBranchSVG(treeSVG, xPos, yPos, xPos + xOffset, yPos + yOffset);
            queue.push([
                node.right,
                depth + 1,
                xPos + xOffset, 
                yPos + yOffset
            ]);
        }
        const isLeaf = (node.left === null) && (node.right === null);
        drawNodeCircleSVG(treeSVG, xPos, yPos, isLeaf);
        drawNodeValueSVG(treeSVG, xPos, yPos, node.val);
    }
    centerHorizontally(treeSVG, displaySVG); // center the tree in the display
};

const drawNodeCircleSVG = (svg, x, y, isLeaf) => {
    svg.append('circle')
        .attr('class', isLeaf ? 'node leaf' : 'node')
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

const centerHorizontally = (tree, display) => {

    const treeRect = tree.node().getBoundingClientRect();
    const treeCenter = treeRect.x + treeRect.width / 2;
    // console.log(treeCenter);

    const displayRect = display.node().getBoundingClientRect();
    const displayCenter = displayRect.x + displayRect.width / 2;
    // console.log(displayCenter);

    tree.attr('transform', `translate(${displayCenter - treeCenter}, 0)`)

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
        const tree = buildTreeFromArray(JSON.parse($treeArrayInput.value));
        renderTreeGraphic(tree);
    });


    renderTreeGraphic(buildTreeFromArray(JSON.parse($treeArrayInput.value)));
};

startApp();

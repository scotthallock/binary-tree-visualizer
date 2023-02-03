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
    console.log({treeDepth}); // 4

    const $display = document.getElementById('display');
    const $tree = document.getElementById('tree');

    const displayRect = $display.getBoundingClientRect();
    const displayWidth = displayRect.width;
    const displayHeight = displayRect.height; // unused

    // BFS traverse through tree and create SVG elements
    const queue = [[root, 1, displayWidth / 2, yOffset]]; // [node, depth, xPos, yPos]
    while (queue.length > 0) {
        const [node, depth, xPos, yPos] = queue.shift();

        // calculate horizontal offset of child nodes
        const xOffset = (treeDepth - depth) * (MIN_HORIZ_DIST / 2);

        if (node.left) {
            // calculate position of child node
            const childXPos = xPos - xOffset;
            const childYPos = yPos + yOffset;
            // draw branch to left child
            $tree.appendChild(createBranchSVG(xPos, yPos, childXPos, childYPos));
            // add left child to queue
            queue.push([node.left, depth + 1, childXPos, childYPos]);
        }
        if (node.right) {
            // calculate position of child node
            const childXPos = xPos + xOffset;
            const childYPos = yPos + yOffset;
            // draw branch to left child
            $tree.appendChild(createBranchSVG(xPos, yPos, childXPos, childYPos));
            // add left child to queue
            queue.push([node.right, depth + 1, childXPos, childYPos]);
        }

        // draw node circle
        $tree.appendChild(createNodeSVG(xPos, yPos));

        // draw node value text
        $tree.appendChild(createValueSVG(xPos, yPos, node.val));
    }
};

const createNodeSVG = (x, y) => {
    const $node = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    $node.setAttribute('class', 'node');
    $node.setAttribute('r', 20); // fixed 20px radius
    $node.setAttribute('cx', x);
    $node.setAttribute('cy', y);
    return $node;
};

const createValueSVG = (x, y, val) => {
    const $text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    $text.setAttribute('class', 'node-val');
    $text.setAttribute('x', x);
    $text.setAttribute('y', y);
    $text.textContent = val;
    return $text;
};

const createBranchSVG = (x1, y1, x2, y2) => {
    const $branch = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    $branch.setAttribute('class', 'branch');
    $branch.setAttribute('x1', x1);
    $branch.setAttribute('y1', y1);
    $branch.setAttribute('x2', x2);
    $branch.setAttribute('y2', y2);
    return $branch;
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
    // create a sample tree
    // const root = buildTreeFromArray([1, 2, null, 3, 4, 5, 6, 7, 8]);
    const root = buildTreeFromArray([2,1,3,null,4,null,7,10,11,null,12,13,14,null,15,16]);
    console.log(root);
    renderTreeGraphic(root);
};

startApp();

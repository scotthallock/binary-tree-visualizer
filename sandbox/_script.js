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

    const treeDepth = maxDepth(root);
    console.log({treeDepth}); // 4

    const $display = document.getElementById('display');
    const $tree = document.getElementById('tree');

    const displayRect = $display.getBoundingClientRect();
    const displayWidth = displayRect.width;
    const displayHeight = displayRect.height; // unused

    // BFS traverse through tree and create SVG elements
    const queue = [[root, 1, displayWidth / 2, 100]]; // [node, depth, xPos, yPos]
    while (queue.length > 0) {
        const [node, depth, xPos, yPos] = queue.shift();
        const $node = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        $node.setAttribute('class', 'node');
        $node.setAttribute('r', 20);
        $node.setAttribute('cx', xPos);
        $node.setAttribute('cy', yPos);
        $tree.appendChild($node);

        const xOffset = (treeDepth - depth + 1) * (MIN_HORIZ_DIST / 2);

        if (node.left) {
            queue.push([node.left, depth + 1, xPos - xOffset, yPos + 100]);
        }
        if (node.right) {
            queue.push([node.right, depth + 1, xPos + xOffset, yPos + 100]);
        }
    }
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
    const root = buildTreeFromArray([1, 2, null, 3, 4, 5, 6, 7, 8]);
    
    renderTreeGraphic(root);
};

startApp();

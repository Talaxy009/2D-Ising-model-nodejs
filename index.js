const process = require("process");
const chalk = require("chalk");
const out = console.log;

/**
 * Ising 模型
 */
class IsingModel {
	/**
	 * 初始化IsingModel
	 * @param {number} size 模型尺寸
	 * @param {number} temperature 温度
	 */
	constructor(size, temperature) {
		this.size = size;
		this.temperature = temperature;
		size++; //行列增加，用于周期边界条件
		this.map = new Array(size);
		for (let i = 0; i < size; i++) {
			this.map[i] = new Array(size);
			for (let j = 0; j < size; j++) {
				if (Math.random() > 0.5) {
					this.map[i][j] = 1;
				} else {
					this.map[i][j] = -1;
				}

			}
		}
		this.hamiltonian = this.getHamiltonian();
	}

	/**
	 * 输出 Ising 图
	 */
	displayMap() {
		for (let i = 0; i < this.size; i++) {
			for (let j = 0; j < this.size; j++) {
				if (this.map[i][j] === 1) {
					process.stdout.write(chalk.red("↑ "));
				} else {
					process.stdout.write(chalk.blue("↓ "));
				}
			}
			process.stdout.write("\n");
		}
	}

	/**
	 * 计算哈密顿量
	 */
	getHamiltonian() {
		let h = 0;
		for (let i = 0; i < this.size; i++) {
			for (let j = 0; j < this.size; j++) {
				h -= this.map[i][j] * this.map[i + 1][j];
				h -= this.map[i][j] * this.map[i][j + 1];
			}
		}
		return h;
	}

	/**
	 * 假设该点跃迁为前提来计算新的哈密顿量
	 * @param {number} row 行
	 * @param {number} column 列
	 */
	refreshHamiltonian(row, column) {
		let h = this.hamiltonian;
		let up = 0;
		let down = this.map[row + 1][column];
		let left = 0;
		let right = this.map[row][column + 1];
		let mid = this.map[row][column];
		if (row !== 0 && column !== 0) {
			up = this.map[row - 1][column];
			left = this.map[row][column - 1];
		} else if (row === 0 && column !== 0) {
			up = this.map[this.size - 1][column];
			left = this.map[row][column - 1];
		} else if (row !== 0 && column === 0) {
			up = this.map[row - 1][column];
			left = this.map[row][this.size - 1];
		} else {
			up = this.map[this.size - 1][column];
			left = this.map[row][this.size - 1];
		}
		const sH = mid * up + mid * down + mid * left + mid * right;
		mid = mid === 1 ? -1 : 1;
		const nH = mid * up + mid * down + mid * left + mid * right;
		h = h + sH - nH;
		return h;
	}

	/**
	 * 设置自旋状态
	 * @param {number} row 行
	 * @param {number} column 列
	 */
	set(row, column) {
		this.map[row][column] = this.map[row][column] === 1 ? -1 : 1;
		//边界同步
		if (row === 0) {
			this.map[this.size][column] = this.map[row][column];
		}
		if (column === 0) {
			this.map[row][this.size] = this.map[row][column];
		}
	}

	/**
	 * 跃迁
	 * @param {number} row 行
	 * @param {number} column 列
	 */
	jump(row, column) {
		const h1 = this.hamiltonian;
		const r = Math.random();
		const h2 = this.refreshHamiltonian(row, column);
		const dh = h1 - h2;
		const w = Math.exp(dh / this.temperature);
		if (w > r) {
			this.set(row, column);
			this.hamiltonian = h2;
		} //自旋接受新状态
	}

	/**
	 * 计算磁化强度
	 */
	getMagnetization() {
		let m = 0;
		const all = this.size * this.size;
		for (let i = 0; i < this.size; i++) {
			for (let j = 0; j < this.size; j++) {
				m += this.map[i][j];
			}
		}
		return Math.abs(m / all);
	}

	/**
	 * 计算磁化率
	 */
	getMagneticSusceptibility() {
		let mt = 0;
		let tm = 0;
		const all = this.size * this.size;
		for (let i = 0; i < this.size; i++) {
			for (let j = 0; j < this.size; j++) {
				tm += this.map[i][j] * this.map[i][j];
				mt += this.map[i][j];
			}
		}
		tm /= all;
		mt /= all;
		mt = mt * mt;
		return (tm - mt) / this.temperature;
	}
}

/**
 * 主函数
 */
function main() {
	const size = 50; //模型尺寸
	const steps = 10000; //蒙特卡罗步
	let Ising = new IsingModel(size, 1);

	out("初始化的 Ising 模型如下:");
	Ising.displayMap();
	out(`磁化强度: ${Ising.getMagnetization()}\n磁化率: ${Ising.getMagneticSusceptibility()}`);

	for (let temp = 5; temp >= 1; temp -= 0.25) {
		Ising.temperature = temp; //降温
		for (let time = 0; time < steps; time++) {
			// 一个蒙特卡罗步
			for (let row = 0; row < size; row++) {
				for (let column = 0; column < size; column++) {
					Ising.jump(row, column);
				}
			}
		}

		out("=======================");
		out(`温度: ${temp}`);
		Ising.displayMap();
		out(`磁化强度: ${Ising.getMagnetization()}\n磁化率: ${Ising.getMagneticSusceptibility()}`);
	}
}
main();
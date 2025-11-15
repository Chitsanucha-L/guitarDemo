import Phaser from "phaser";

const chords = {
  C: { E6: 0, A: 3, D: 2, G: 0, B: 1, e1: 0 },
  G: { E6: 3, A: 2, D: 0, G: 0, B: 0, e1: 3 },
  Am: { E6: 0, A: 0, D: 2, G: 2, B: 1, e1: 0 },
} as const;

type ChordName = keyof typeof chords;

export default class GuitarGame2D extends Phaser.Scene {
  private isGameRunning = false;

  private isGamePaused = false;
  private pauseButton!: Phaser.GameObjects.Text;


  private currentChord: ChordName = "C";
  private chordNotes: Record<string, number> = {};
  private score: number = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private chordText!: Phaser.GameObjects.Text;

  private stringsY = [100, 140, 180, 220, 260, 300];
  private fretsX = [80, 150, 220, 290, 360, 430]; // fret 0-5
  private strings = ["e1", "B", "G", "D", "A", "E6"]; // สาย 1-6
  private chordStartTime = 0;

  private timerBar!: Phaser.GameObjects.Rectangle;
  private timerBarWidth = 400;
  private timerBarHeight = 20;
  private maxTime = 10;

  private hitboxGap = 12;

  constructor() {
    super("GuitarGame2D");
  }

  create() {
    // UI แสดง Score / Chord / Timer
    this.scoreText = this.add.text(500, 50, `Score: 0`, { fontSize: "24px", color: "#fff" });
    this.timerText = this.add.text(500, 90, `Time: 0`, { fontSize: "24px", color: "#fff" });
    this.chordText = this.add.text(500, 130, `Chord: -`, { fontSize: "24px", color: "#ffff00" });

    // แทบเวลา
    this.timerBar = this.add.rectangle(50, 50, this.timerBarWidth, this.timerBarHeight, 0x00ff00)
      .setOrigin(0, 0.5);

    this.pauseButton = this.add.text(750, 20, 'Pause', { fontSize: '24px', color: '#ffff00', backgroundColor: '#000' })
      .setInteractive()
      .on('pointerdown', () => {
        this.togglePause();
      });


    // วาดสาย + ชื่อสาย
    this.strings.forEach((string, sIdx) => {
      // ชื่อสาย
      this.add.text(this.fretsX[0] - 50, this.stringsY[sIdx], string, { fontSize: "20px", color: "#fff" })
        .setOrigin(0, 0.5);

      // สาย
      this.add.line(0, 0, this.fretsX[0], this.stringsY[sIdx], this.fretsX[this.fretsX.length - 1], this.stringsY[sIdx], 0xD4AF37)
        .setOrigin(0, 0)
        .setLineWidth(sIdx === 5 ? 3 : 2); // สายเบสหนาสุด
    });

    // วาด fret
    this.fretsX.forEach(x => {
      this.add.rectangle(x - 5, (this.stringsY[0] + this.stringsY[5]) / 2, 10, 220, 0x8B5A2B);
    });

    // สร้าง hitbox แยก fret
    this.strings.forEach((string, sIdx) => {
      for (let f = 0; f < this.fretsX.length - 1; f++) {
        const fretWidth = this.fretsX[f + 1] - this.fretsX[f] - this.hitboxGap;
        const x = this.fretsX[f] + fretWidth / 2 + this.hitboxGap / 2 - 5;
        const y = this.stringsY[sIdx];

        const hitbox = this.add.rectangle(x, y, fretWidth, 30, 0x00ffff, 0.3)
          .setOrigin(0.5, 0.5)
          .setInteractive();

        hitbox.on("pointerdown", () => this.checkNote(string, f + 1));
      }
    });

    // ปุ่ม Start Game
    const startButton = this.add.text(500, 200, 'Start Game', { fontSize: '24px', color: '#00ff00', backgroundColor: '#000' })
      .setInteractive()
      .on('pointerdown', () => {
        this.startGame();
        startButton.destroy();
      });
  }

  startGame() {
    this.isGameRunning = true;
    this.score = 0;
    this.scoreText.setText(`Score: ${this.score}`);
    this.pickRandomChord();
    this.chordStartTime = this.time.now;
    this.timerBar.width = this.timerBarWidth;
  }

  pickRandomChord() {
    const keys = Object.keys(chords) as ChordName[];
    this.currentChord = keys[Math.floor(Math.random() * keys.length)];
    this.chordNotes = { ...chords[this.currentChord] };
    this.chordStartTime = this.time.now;
    if (this.chordText) this.chordText.setText(`Chord: ${this.currentChord}`);
  }

  checkNote(string: string, fret: number) {
    const correct = this.chordNotes[string];

    // ถ้า fret = 0 (สายเปิด) ไม่ต้องเช็ค
    if (fret === 0) return;

    if (fret === correct) {
      const timeTaken = (this.time.now - this.chordStartTime) / 1000;
      this.score += Math.max(100 - Math.floor(timeTaken * 10), 10);

      // ลบสายที่ถูกกดออกจาก chordNotes
      delete this.chordNotes[string];

      // ตรวจสอบว่าเหลือสายที่ต้องกด (fret > 0) หรือไม่
      const remaining = Object.entries(this.chordNotes).filter(([s, f]) => f > 0);

      if (remaining.length === 0) {
        // ถ้าไม่มีสายที่ต้องกด → เปลี่ยนคอร์ด
        this.pickRandomChord();
        this.chordStartTime = this.time.now; // reset timer
      }
    } else {
      this.score -= 5;
    }

    this.scoreText.setText(`Score: ${this.score}`);
  }


  togglePause() {
    this.isGamePaused = !this.isGamePaused;

    if (this.isGamePaused) {
      this.pauseButton.setText('Resume');
    } else {
      // รีเซ็ตเวลาเริ่มให้ต่อจากที่ pause
      this.chordStartTime = this.time.now - (this.time.now - this.chordStartTime);
      this.pauseButton.setText('Pause');
    }
  }


  lose() {
    this.isGameRunning = false; // หยุด timer
    const loseText = this.add.text(250, 200, 'Time\'s up! You lose!', { fontSize: '32px', color: '#ff0000' })
      .setOrigin(0.5);

    const restartButton = this.add.text(250, 250, 'Restart', { fontSize: '28px', color: '#00ff00', backgroundColor: '#000' })
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => {
        // ลบข้อความแพ้ + ปุ่ม
        loseText.destroy();
        restartButton.destroy();
        this.startGame();
      });
  }

  update() {
    if (!this.isGameRunning || this.isGamePaused) return; // ถ้าเกมยังไม่เริ่มหรือ pause ให้หยุด

    const elapsed = (this.time.now - this.chordStartTime) / 1000;

    const remainingRatio = Phaser.Math.Clamp(1 - elapsed / this.maxTime, 0, 1);
    this.timerBar.width = this.timerBarWidth * remainingRatio;

    this.timerText.setText(`Time: ${elapsed.toFixed(1)}s`);

    if (elapsed >= this.maxTime) {
      this.lose();
    }
  }

}

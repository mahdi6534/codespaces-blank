import { chromium } from "playwright";
import { newInjectedContext } from "fingerprint-injector";
import { checkTz } from "./tz_px.js";
import "dotenv/config";

const bots = process.argv[2];
const url = process.argv[3];

function generateRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const locations = [
  "se", // Sweden

  "ng", // Nigeria
  "cm", // Cameroon

  "ci", // Cote D'Ivoire

  "ua", // Ukraine

  "at", // Austria
  "at", // Austria

  "fr", // France

  "ca", // Canada
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "us", // United States
  "fr", // France
  "fr", // France
  "fr", // France
  "uk", // United Kingdom
  "au", // Australia
  "de", // Germany
  "jp", // Japan
  "sg", // Singapore
  "kr", // South Korea
  "it", // Italy
  "es", // Spain
  "in", // India
  "id", // Indonesia
  "ph", // Philippines
  "th", // Thailand
  "my", // Malaysia
  "eg", // Egypt
  "tr", // Turkey
  "pk", // Pakistan (English speakers, strong internet growth)
  "bd", // Bangladesh (growing internet users, relevance to global content)
  "mx", // Mexico (geographical proximity, U.S. ties)
  "lk", // Sri Lanka
  "ml", // Mali
  "bj", // Benin
  "ug", // Uganda
  "mm", // Myanmar
  "no", // Norway
  "pf", // French Polynesia
  "np", // Nepal
  "bf", // Burkina Faso
  "cd", // Congo, The Democratic Republic of the
  "bi", // Burundi
  "gf", // French Guiana
  "cf", // Central African Republic
  "hk", // Hong Kong
  "cg", // Congo
];

// Function to select a random user preference
const weightedRandom = (weights) => {
  let totalWeight = weights.reduce((sum, weight) => sum + weight.weight, 0);
  let random = Math.random() * totalWeight;
  for (let i = 0; i < weights.length; i++) {
    if (random < weights[i].weight) return weights[i].value;
    random -= weights[i].weight;
  }
};

// Preferences for user agents and devices
const preferences = [
  {
    value: { device: "desktop", os: "windows", browser: "chrome" },
    weight: 20,
  },

  {
    value: { device: "mobile", os: "android", browser: "chrome" },
    weight: 100,
  },
];

export const generateNoise = () => {
  const shift = {
    r: Math.floor(Math.random() * 5) - 2,
    g: Math.floor(Math.random() * 5) - 2,
    b: Math.floor(Math.random() * 5) - 2,
    a: Math.floor(Math.random() * 5) - 2,
  };
  const webglNoise = (Math.random() - 0.5) * 0.01;
  const clientRectsNoise = {
    deltaX: (Math.random() - 0.5) * 2,
    deltaY: (Math.random() - 0.5) * 2,
  };
  const audioNoise = (Math.random() - 0.5) * 0.000001;

  return { shift, webglNoise, clientRectsNoise, audioNoise };
};

export const noisifyScript = (noise) => `
  (function() {
    const noise = ${JSON.stringify(noise)};

    // Canvas Noisify
    const getImageData = CanvasRenderingContext2D.prototype.getImageData;
    const noisify = function (canvas, context) {
      if (context) {
        const shift = noise.shift;
        const width = canvas.width;
        const height = canvas.height;
        if (width && height) {
          const imageData = getImageData.apply(context, [0, 0, width, height]);
          for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
              const n = ((i * (width * 4)) + (j * 4));
              imageData.data[n + 0] = imageData.data[n + 0] + shift.r;
              imageData.data[n + 1] = imageData.data[n + 1] + shift.g;
              imageData.data[n + 2] = imageData.data[n + 2] + shift.b;
              imageData.data[n + 3] = imageData.data[n + 3] + shift.a;
            }
          }
          context.putImageData(imageData, 0, 0); 
        }
      }
    };
    HTMLCanvasElement.prototype.toBlob = new Proxy(HTMLCanvasElement.prototype.toBlob, {
      apply(target, self, args) {
        noisify(self, self.getContext("2d"));
        return Reflect.apply(target, self, args);
      }
    });
    HTMLCanvasElement.prototype.toDataURL = new Proxy(HTMLCanvasElement.prototype.toDataURL, {
      apply(target, self, args) {
        noisify(self, self.getContext("2d"));
        return Reflect.apply(target, self, args);
      }
    });
    CanvasRenderingContext2D.prototype.getImageData = new Proxy(CanvasRenderingContext2D.prototype.getImageData, {
      apply(target, self, args) {
        noisify(self.canvas, self);
        return Reflect.apply(target, self, args);
      }
    });

    // Audio Noisify
    const originalGetChannelData = AudioBuffer.prototype.getChannelData;
    AudioBuffer.prototype.getChannelData = function() {
      const results = originalGetChannelData.apply(this, arguments);
      for (let i = 0; i < results.length; i++) {
        results[i] += noise.audioNoise; // Smaller variation
      }
      return results;
    };

    const originalCopyFromChannel = AudioBuffer.prototype.copyFromChannel;
    AudioBuffer.prototype.copyFromChannel = function() {
      const channelData = new Float32Array(arguments[1]);
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] += noise.audioNoise; // Smaller variation
      }
      return originalCopyFromChannel.apply(this, [channelData, ...Array.prototype.slice.call(arguments, 1)]);
    };

    const originalCopyToChannel = AudioBuffer.prototype.copyToChannel;
    AudioBuffer.prototype.copyToChannel = function() {
      const channelData = arguments[0];
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] += noise.audioNoise; // Smaller variation
      }
      return originalCopyToChannel.apply(this, arguments);
    };

    // WebGL Noisify
    const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function() {
      const value = originalGetParameter.apply(this, arguments);
      if (typeof value === 'number') {
        return value + noise.webglNoise; // Small random variation
      }
      return value;
    };

    // ClientRects Noisify
    const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function() {
      const rect = originalGetBoundingClientRect.apply(this, arguments);
      const deltaX = noise.clientRectsNoise.deltaX; // Random shift between -1 and 1
      const deltaY = noise.clientRectsNoise.deltaY; // Random shift between -1 and 1
      return {
        x: rect.x + deltaX,
        y: rect.y + deltaY,
        width: rect.width + deltaX,
        height: rect.height + deltaY,
        top: rect.top + deltaY,
        right: rect.right + deltaX,
        bottom: rect.bottom + deltaY,
        left: rect.left + deltaX
      };
    };
  })();
`;

// Function to simulate random clicks on a page
const performRandomClicks = async (page) => {
  const numClicks = generateRandomNumber(2, 4); // Random number between 2 and 4
  for (let i = 0; i < 1; i++) {
    const width = await page.evaluate(() => window.innerWidth);
    const height = await page.evaluate(() => window.innerHeight);
    const x = generateRandomNumber(0, width);
    const y = generateRandomNumber(0, height);

    await page.mouse.click(x, y);
    console.log(`Click ${i + 1} performed at position (${x}, ${y})`);
    await page.waitForTimeout(generateRandomNumber(2000, 3000));
  }
};

const blockResources = async (page) => {
  await page.route("**/*", (route) => {
    const resourceType = route.request().resourceType();
    if (["image", "stylesheet", "media"].includes(resourceType)) {
      route.abort();
    } else {
      route.continue();
    }
  });
};

const OpenBrowser = async (link, username) => {
  const userPreference = weightedRandom(preferences);
  console.log(userPreference);
  const timezone = await checkTz(username);
  if (timezone == undefined) {
    return;
  }
  const browser = await chromium.launch({
    headless: false,
    proxy: {
      server: `${process.env.PROXY_SERVER}:${process.env.PROXY_PORT}`,
      username: username,
      password: process.env.PROXY_PASSWORD,
    },
  });

  const context = await newInjectedContext(browser, {
    // fingerprintOptions: {
    //   devices: [userPreference.device],
    //   browsers: [userPreference.browser],
    //   operatingSystems: [userPreference.os],
    // },
    fingerprintOptions: {
      devices: [userPreference.device],
      browsers: [userPreference.browser],
      operatingSystems: [userPreference.os],
      mockWebRTC: true,
    },
    newContextOptions: {
      timezoneId: timezone || "America/New_York",
    },
  });
  try {
    const noise = generateNoise();
    const page = await context.newPage();
    // add media blockers
    await blockResources(page);
    await page.addInitScript(noisifyScript(noise));
    console.log(
      "Browser view from ->",
      timezone,
      "website -> ",
      url,
      "threads :",
      bots
    );
    await page.goto(link, { waitUntil: "load" });
    await page.waitForTimeout(7000);
    await performRandomClicks(page);
    await page.waitForTimeout(30000);
  } catch (error) {
    console.log(error);
  } finally {
    await context.close();
    await browser.close();
  }
};

const tasksPoll = async (views) => {
  const tasks = Array.from({ length: Number(bots) ? Number(bots) : 4 }).map(
    () => {
      let location = locations[generateRandomNumber(0, locations.length + 1)];
      const username =
        "user-doublemobmedia-sessionduration-10-country-" +
        location +
        "-session-" +
        String(generateRandomNumber(10000, 10000000));

      return OpenBrowser(url ? url : "https://www.google.com", username);
    }
  );

  await Promise.all(tasks);
};

const RunTasks = async () => {
  let views = 0;
  for (let i = 0; i < 14534554; i++) {
    views++;
    console.log(views * Number(bots));
    await tasksPoll(views);
  }
};

RunTasks();

/* Vue PoC bridge
   Tries to dynamically import the PoC from a running Vite dev server
   (common dev ports are tried), or from a built /vue-poc/dist bundle.
   Exposes `window.mountVuePoC(containerSelector)` and `window.vuePocBridge`.
*/
(function(){
  const bridge = {
    mounted: false,
    unmountFn: null,
    async mount(containerSelector = '#quiz'){
      const container = document.querySelector(containerSelector);
      if(!container) return console.warn('Vue PoC bridge: container not found', containerSelector);
      if(this.mounted) return console.log('Vue PoC already mounted');

      // clear container for PoC mount
      container.innerHTML = '';
      const mountEl = document.createElement('div');
      mountEl.id = 'vue-poc-root';
      container.appendChild(mountEl);

      const devUrls = [
        'http://127.0.0.1:5175/src/main.js',
        'http://localhost:5175/src/main.js',
        'http://127.0.0.1:5173/src/main.js',
        'http://localhost:5173/src/main.js'
      ];

      for(const url of devUrls){
        try{
          const mod = await import(/* @vite-ignore */ url);
          if(mod && typeof mod.mount === 'function'){
            this.unmountFn = mod.mount('#vue-poc-root');
            this.mounted = true;
            console.log('Vue PoC mounted from', url);
            return this.unmountFn;
          }
        }catch(e){ /* ignore and try next */ }
      }

      // try production build path
      try{
        const mod = await import('/vue-poc/dist/main.js');
        if(mod && typeof mod.mount === 'function'){
          this.unmountFn = mod.mount('#vue-poc-root');
          this.mounted = true;
          console.log('Vue PoC mounted from /vue-poc/dist/main.js');
          return this.unmountFn;
        }
      }catch(e){ console.warn('Vue PoC bridge: failed to load from dist', e); }

      console.error('Vue PoC bridge: could not load Vue PoC. Start the PoC dev server or build it into /vue-poc/dist.');
    },
    async unmount(){
      if(!this.mounted) return;
      if(typeof this.unmountFn === 'function'){
        try{ this.unmountFn(); }catch(_){}
      }
      const el = document.getElementById('vue-poc-root');
      if(el) el.remove();
      this.mounted = false;
      this.unmountFn = null;
    }
  };

  window.vuePocBridge = bridge;
  window.mountVuePoC = (sel)=>bridge.mount(sel);
})();

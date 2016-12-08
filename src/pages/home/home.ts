import { Component, ViewChild } from '@angular/core';
import { NavController, LoadingController, ActionSheetController, Content } from 'ionic-angular';
import { InAppBrowser } from 'ionic-native';
import { RedditService } from '../../providers/reddit-service';
import { FormControl } from '@angular/forms';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})

export class HomePage {

  @ViewChild(Content) content: Content;

  public feeds: Array<any>;
  private url: string = "https://www.reddit.com/new.json";
  private olderPosts: string = "https://www.reddit.com/new.json?after=";
  private newerPosts: string = "https://www.reddit.com/new.json?before=";

  public noFilter: Array<any>;
  public hasFilter: boolean = false;

  public searchTerm: string = '';
  public searchTermControl: FormControl;

  constructor(public redditService: RedditService,
              public navCtrl: NavController, 
              public loadingCtrl: LoadingController, 
              public actionSheetCtrl: ActionSheetController) {

    this.fetchContent();

    this.searchTermControl = new FormControl();
    this.searchTermControl.valueChanges.debounceTime(1000).distinctUntilChanged().subscribe(search => {
      if (search !== '' && search) {
        this.filterItems();
      }
    })
  }

  fetchContent(): void {
    let loading = this.loadingCtrl.create({
      content: 'Carregando conteúdo...'
    });

    loading.present();

    this.redditService.fetchData(this.url).then(data => {
      this.feeds = data;
      this.noFilter = this.feeds;
      loading.dismiss();
    })
  }

  itemSelected(url: string): void {
    let browser = new InAppBrowser(url, '_system');
  }

  doInfinite(infiniteScroll) {
    let paramsUrl = (this.feeds.length > 0) ? this.feeds[this.feeds.length - 1].data.name : "";

    this.redditService.fetchData(this.olderPosts + paramsUrl).then(data => {
      this.feeds = this.feeds.concat(data);
      this.noFilter = this.feeds;
      this.hasFilter = false;

      infiniteScroll.complete();
    })
  }

  doRefresh(refresher) {

    let paramsUrl = this.feeds[0].data.name;

    this.redditService.fetchData(this.newerPosts + paramsUrl).then(data => {
      this.feeds = data.concat(this.feeds);
      this.noFilter = this.feeds;
      this.hasFilter = false;
      refresher.complete();
    })
  }

  showFilters(): void {

    this.content.scrollToTop();

    let actionSheet = this.actionSheetCtrl.create({
      title: 'Opções de filtro:',
      buttons: [
        {
          text: 'Música',
          handler: () => {
            this.feeds = this.noFilter.filter((item) => item.data.subreddit.toLowerCase() === "music");
            this.hasFilter = true;
          }
        },
        {
          text: 'Filmes',
          handler: () => {
            this.feeds = this.noFilter.filter((item) => item.data.subreddit.toLowerCase() === "movies");
            this.hasFilter = true;
          }
        },
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            this.feeds = this.noFilter;
            this.hasFilter = false;
          }
        }
      ]
    });

    actionSheet.present();

  }

  filterItems() {
    this.hasFilter = false;
    this.feeds = this.noFilter.filter((item) => {
      return item.data.title.toLowerCase().indexOf(this.searchTerm.toLowerCase()) > -1;
    });
  }
}

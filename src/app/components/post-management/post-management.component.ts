import { Component, OnInit } from '@angular/core';
import { ForumService, Post } from '../../forum.service';

@Component({
  selector: 'app-post-management',
  templateUrl: './post-management.component.html',
  styleUrls: ['./post-management.component.scss'],
})
export class PostManagementComponent implements OnInit {
  searchTerm = '';
  currentFilter = 'all';
  currentSort = 'newest';
  allPosts: Post[] = [];
  filteredPosts: Post[] = [];
  pendingPosts: Post[] = [];
  approvedPosts: Post[] = [];

  constructor(private forumService: ForumService) {}

  ngOnInit() {
    this.forumService.getPosts().subscribe((posts) => {
      this.allPosts = posts;
      this.approvedPosts = posts.filter((post) => post.approved);
      this.applyFilters();
    });

    this.forumService.getPostsForApproval().subscribe((posts) => {
      this.pendingPosts = posts;
      this.applyFilters();
    });
  }

  onSearchChange(searchTerm: string) {
    this.searchTerm = searchTerm;
    this.applyFilters();
  }

  onFilterChange(filter: string) {
    this.currentFilter = filter;
    this.applyFilters();
  }

  onSortChange(sort: string) {
    this.currentSort = sort;
    this.applyFilters();
  }

  approvePost(post: Post) {
    this.forumService.approvePost(post.id!).then(() => {
      post.approved = true;
      this.pendingPosts = this.pendingPosts.filter((p) => p.id !== post.id);
      this.approvedPosts.push(post);
      this.applyFilters();
    });
  }

  deletePost(post: Post) {
    this.forumService.deletePost(post.id!).then(() => {
      this.pendingPosts = this.pendingPosts.filter((p) => p.id !== post.id);
      this.approvedPosts = this.approvedPosts.filter((p) => p.id !== post.id);
      this.applyFilters();
    });
  }

  private applyFilters() {
    let filtered =
      this.currentFilter === 'pending'
        ? [...this.pendingPosts]
        : this.currentFilter === 'approved'
        ? [...this.approvedPosts]
        : [...this.allPosts];

    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.content.toLowerCase().includes(searchLower) ||
          post.authorName.toLowerCase().includes(searchLower)
      );
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return this.currentSort === 'newest' ? dateB - dateA : dateA - dateB;
    });

    this.filteredPosts = filtered;
  }
}

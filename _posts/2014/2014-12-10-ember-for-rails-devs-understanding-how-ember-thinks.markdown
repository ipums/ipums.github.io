---
layout: page
title: 'Ember for Rails Devs: Understanding How Ember Thinks'
teaser: 'An introduction to Ember.js for devs who are used to thinking in Rails.'
author: jakew
date: '2014-12-10 12:47:16 -0600'
date_gmt: '2014-12-10 18:47:16 -0600'
categories: Code Infrastructure
---
In my <a href="{{site.url}}/take-it-and-run-a-tale-of-risk-failure-and-the-beginning-of-a-javascript-journey/" title="previous post">previous post</a>, I talked about our project's desperate need for a major Javascript refactoring, and how I got over the fear of failure in tackling this huge challenge. Now that I've set out on this task, all I had to do was figure out where to go next. Easier said than done with the wealth of Javascript tools and frameworks to choose from. After consulting with the rest of the team I decided I would take a run at Ember.js to see if that would bear fruit. The following is an overview of what I learned about how Ember works, tailored to someone with a background in Rails.

I like to think of Ember in terms of its flow control. Rails has a structured flow control too, and the two are easily compared. In Rails our flow looks like this:

Routes &rarr; Controllers &rarr; (Models &rarr; Controllers) &rarr; Views &rarr; (Helpers &rarr; Views)

Here's what it looks like in Ember:

Router.js &rarr; Route Class &rarr; (Models &rarr; Route Class) &rarr; Controllers &rarr; Views &rarr; Templates

There are a few noticeable differences between the two, and I went through some culture shock before I fully grasped how things worked in Ember. Coming from Rails and with a bit of background in AngularJS I had never really worked with an MV* framework which isn't MVC. In both Rails and Angular the controller was the one responsible for binding the data to the view (in Angular you have an object called $scope that both the controller and the view can see.) Rails works in a very similar way, giving access inside the view to any instance variables declared in the controller. This means that within the logic of the controller you are supposed to bind models, functions, and whatever else you want to access within the view.

In Ember, however, you actually bind your models inside your route classes. Then the controller can decorate the model with its own methods/bindings before passing it onto the view. It's an interesting design decision, because it doesn't leave you with a lot of reasons to have fat controllers. In fact, I didn't even use custom controllers at all in my initial proof of concept, which was to reimplement a small part of our NHGIS app workflow using Ember.

Lets dive a little deeper into the two parts of routing in Ember. The `Router.js` file is the master route declaration which looks a lot like Rails' `config/routes.rb` file. It declares paths that the user can navigate to in a nested format. Here's an example in Ember:

{% highlight js %}
{% raw %}
{{{javascript
//router.js
ExtractCreator.Router.map(function() {
        	this.route('add', { path: '/' }, function () {
                    	this.route('results', { path: '/' });
                    	this.route('geog_level_filters');
                    	this.route('year_filters');
                    	this.route('topic_filters');
                    	this.route('dataset_filters');
        	});
});}}}
{% endraw %}
{% endhighlight %}

Unlike in Rails, these declarations do not require REST verbs to be attached to them - they are only navigation paths for the user, not a server waiting for different types of requests.

And here's what a Route class file looks like:

{% highlight js %}
{% raw %}
{{{javascript
//routes/add_route.js
ExtractCreator.AddRoute = Ember.Route.extend({
        	model: function () {
                    	return this.store.find('result', 1);
        	}
});
}}}
{% endraw %}
{% endhighlight %}

There's a few important things going on here. The first is how it is binding the `AddRoute` object to the `ExtractCreator` object. In Ember we create one global variable that represents the entire application - `ExtractCreator` in our example. The name `AddRoute` corresponds to the declaration of the route `add` from the `Router.js`. After extending Ember's default route, I bind the model by using EmberData's store object. EmberData is a library that is tightly coupled with Ember and provides model synchronization services to a server.

After the route class file, we have the controller which now can be used to add functions to the model which are route-specific. If you don't define a controller for a specific route, then a generic controller will be automatically created and used.

Next, we have views. Views are files where you place custom javascript actions for a specific template. If something needs to happen when the user makes an action which doesn't directly affect a model, then that code goes here. For example I implemented a jqgrid.js table within my Ember application as follows:

{% highlight js %}
{% raw %}
{{{javascript
// add_view.js
ExtractCreator.AddView = Ember.View.extend({
        	didInsertElement : function(){
                    	this._super();
  	// jqgrid code goes here
        	}
});
}}}
{% endraw %}
{% endhighlight %}

I'm using the supplied didInsertElementHook to run code after the specific template has loaded on the page. There are many other hooks available and you can write custom callable functions as well.

Lastly, there are templates which contain mustache templates that get transformed into html. Templates are loaded in the following hierarchy:

* application.handlebars
* add.handlebars

The files would look like this:

{% highlight html %}
{% raw %}
{{{html
<!-- application.handlebars !-->

<section id="subnav">
   Some things
</section>

<section id="lower-section" class="clearfix">
        	{{outlet}}
</section>

<!-- add.handlebars -->

<section id="side-nav">
<ul class="add-nav">
                    	{{#link-to 'add.results'}}
<li>Add Data</li>{{/link-to}}
                    	{{#link-to 'add.geog_level_filters'}}
<li>Filter Geog Levels</li>{{/link-to}}
                    	{{#link-to 'add.year_filters'}}
<li>Filter Years</li>{{/link-to}}
                    	{{#link-to 'add.topic_filters'}}
<li>Topics</li>{{/link-to}}
                    	{{#link-to 'add.dataset_filters'}}
<li>Datasets</li>{{/link-to}}
        	</ul>

<aside class="filter-overview">
                    	{{#if model.has_results}}

<h3>Filtered Data</h3>
                    	{{else}}

<h3>Total Data</h3>
                    	{{/if}}

<h4>Source Tables: {{model.source_tables_count}}</h4>

<h4>Time Series Tables: {{model.ts_tables_count}}</h4>

<h4>Boundary Files: {{model.boundary_files_count}}</h4>
        	</aside>
</section>

<section id="main-view" class="clearfix">
        	{{outlet}}
</section>

}}}
{% endraw %}
{% endhighlight %}
{% raw %}
The `{{outlet}}` directive means yield any sub template into this area. The `add.handlebars` gets put into the `{{outlet}}` part of the application template, and any sub templates of `add` get put into the `{{outlet}}` part of `add`. Sub templates might come from the results route or any of the filter routes as seen in the router.js file. The `{{model.ts_tables_count}}` directive means print out the `ts_tables_count` property of the model attached to this specific route. If that model changes for any reason, that value will also change immediately, without having to re-render the entire template.
{% endraw %}
So that's a quick peek at my first adventure into Ember.js. I'm still not sure that it's the best solution for our project, but I learned how Ember and Rails "think differently" about application workflow. I'll continue to explore what Ember can offer, and blog more about the process in the future. If you've found this helpful, please let me know in the comments. Thanks for reading!
